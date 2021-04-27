// Modified from node module pdf-image: https://www.npmjs.com/package/pdf-image
// the original version has the undesired sorting of the output (eg. 1, 10, 11, ..., 2, 20, 21,...)

const path = require('path');
const { stat } = require('fs').promises;
const { exec } = require('child_process');

class PDFImage {
	#pdfFilePath;

	// options
	#outputDirectory;
	#imageFileBaseName;
	#outputThumbnailsDirectory;
	#thumbnailFileBaseName;
	#convertOptions;
	#convertExtension;
	#useGM;
	#combinedImage;

	constructor(pdfFilePath, options) {
		if (!options) options = {};
		this.#pdfFilePath = pdfFilePath;
		this.#outputDirectory = options.outputDirectory || path.dirname(pdfFilePath);
		this.#imageFileBaseName = options.imageFileBaseName || path.basename(this.#pdfFilePath, '.pdf');
		this.#outputThumbnailsDirectory = options.outputThumbnails || false;
		this.#thumbnailFileBaseName = options.thumbnailFileBaseName || path.basename(this.#pdfFilePath, '.pdf');
		this.#convertOptions = options.convertOptions || {};
		this.#convertExtension = options.convertExtension || 'png';
		this.#useGM = options.graphicsMagick || false;
		this.#combinedImage = options.combinedImage || false;
	}

	getInfo = () => {
		return new Promise((resolve, reject) => {
			exec(`pdfinfo "${this.#pdfFilePath}"`, (err, stdout, stderr) => {
				if (err) {
					return reject({
						message: "Failed to get PDF'S information",
						error: err,
						stdout: stdout,
						stderr: stderr,
					});
				}
				const info = {};
				stdout.split('\n').forEach((line) => {
					if (line.match(/^(.*?):[ \t]*(.*)$/)) {
						info[RegExp.$1] = RegExp.$2;
					}
				});
				return resolve(info);
			});
		});
	};

	convertFile = async () => {
		const numPages = await this.#numberOfPages();
		const imagePaths = [];
		const convertPromises = [];
		for (let i = 0; i < numPages; i++) {
			convertPromises.push(
				this.convertPage(i).then((imagePath) => {
					imagePaths.push(imagePath);
				})
			);
		}
		await Promise.all(convertPromises);
		// Because of async convert we have to re-sort pages.
		// Ensure that filenames are sorted naturally (numerically)
		imagePaths.sort((a, b) => {
			a = a.split('-');
			a = a[a.length - 1].split('.')[0];
			b = b.split('-');
			b = b[b.length - 1].split('.')[0];
			return a - b;
		});
		if (this.#combinedImage) {
			const combinedImage = await this.#combineImages(imagePaths);
			return combinedImage;
		}
		return imagePaths;
	};

	convertPage = async (pageNum) => {
		const outputImagePath = this.#getOutputImagePathForPage(pageNum);
		// convert when (1) image doesn't exits or (2) image exists
		// but its timestamp is older than pdf's one
		let outputImageStat;
		try {
			outputImageStat = await stat(outputImagePath);
		} catch (err) {
			if (err.code !== 'ENOENT') throw err;
			// (1) file does not exist
			await this.#convertPageToImage(pageNum);
			return outputImagePath;
		}
		const pdfStat = await stat(this.#pdfFilePath);
		if (outputImageStat.mtime < pdfStat.mtime) {
			// (2)
			await this.#convertPageToImage(pageNum);
		} else {
			console.log(`Image ${outputImagePath} newer than PDF, skipping`);
		}
		return outputImagePath;
	};

	#numberOfPages = async () => {
		const info = await this.getInfo();
		return info['Pages'];
	};
	#getOutputImagePathForPage = (pageNumber) => {
		return path.join(
			this.#outputDirectory,
			this.#imageFileBaseName + '-' + pageNumber + '.' + this.#convertExtension
		);
	};
	#getOutputThumbnailPathForImage = (pageNumber) => {
		return path.join(
			this.#outputThumbnailsDirectory,
			this.#thumbnailFileBaseName + '-' + pageNumber + '.' + this.#convertExtension
		);
	};
	#getOutputImagePath = () => {
		return path.join(this.#outputDirectory, this.#imageFileBaseName + '.' + this.#convertExtension);
	};

	#constructConvertCommandForPage = (pageNumber) => {
		const pdfFilePath = this.#pdfFilePath;
		const outputImagePath = this.#getOutputImagePathForPage(pageNumber);
		const convertOptionsString = this.#constructConvertOptions();
		return `${this.#useGM ? 'gm convert' : 'convert'} ${
			convertOptionsString ? convertOptionsString + ' ' : ''
		}"${pdfFilePath}[${pageNumber}]" "${outputImagePath}"`;
	};
	#constructConvertImageToThumbnailCommand = (pageNumber) => {
		const imagePath = this.#getOutputImagePathForPage(pageNumber);
		const outputThumbnailPath = this.#getOutputThumbnailPathForImage(pageNumber);
		return `${this.#useGM ? 'gm convert' : 'convert'} "${imagePath}" -thumbnail "80x45>" "${outputThumbnailPath}"`;
	};
	#constructCombineCommandForFile = (imagePaths) => {
		return `${this.#useGM ? 'gm convert' : 'convert'} -append ${imagePaths.join(
			' '
		)} "${this.#getOutputImagePath()}"`;
	};
	#constructConvertOptions = () => {
		return Object.keys(this.#convertOptions)
			.sort()
			.map((optionName) => {
				if (this.#convertOptions[optionName] !== null) {
					return optionName + ' ' + this.#convertOptions[optionName];
				} else {
					return optionName;
				}
			})
			.join(' ');
	};
	#combineImages = (imagePaths) => {
		const combineCommand = this.#constructCombineCommandForFile(imagePaths);
		return new Promise(function (resolve, reject) {
			exec(combineCommand, function (err, stdout, stderr) {
				if (err) {
					return reject({
						message: 'Failed to combine images',
						error: err,
						stdout: stdout,
						stderr: stderr,
					});
				}
				exec('rm ' + imagePaths.join(' ')); //cleanUp
				return resolve(this.getOutputImagePathForFile());
			});
		});
	};
	#convertPageToImage = (pageNum) => {
		const convertCommand = this.#constructConvertCommandForPage(pageNum);
		return new Promise((resolve, reject) => {
			exec(convertCommand, (err, stdout, stderr) => {
				if (err) {
					return reject({
						message: 'Failed to convert page to image',
						error: err,
						stdout: stdout,
						stderr: stderr,
					});
				}
				if (this.#outputThumbnailsDirectory) {
					const convertToThumbnailCommand = this.#constructConvertImageToThumbnailCommand(pageNum);
					exec(convertToThumbnailCommand, (err, stdout, stderr) => {
						if (err) {
							return reject({
								message: 'Failed to convert image to thumbnail',
								error: err,
								stdout: stdout,
								stderr: stderr,
							});
						}
						return resolve();
					});
				} else {
					return resolve();
				}
			});
		});
	};
}

module.exports = PDFImage;
