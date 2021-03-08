// Modified from node module pdf-image: https://www.npmjs.com/package/pdf-image
// the original version has the undesired sorting of the output (eg. 1, 10, 11, ..., 2, 20, 21,...)

const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');

class PDFImage {
	constructor(pdfFilePath, options) {
		if (!options) options = {};

		this.pdfFilePath = pdfFilePath;

		this.setPdfFileBaseName(options.pdfFileBaseName);
		this.setThumbnailFileBaseName(options.thumbnailFileBaseName);
		this.setConvertOptions(options.convertOptions);
		this.setConvertExtension(options.convertExtension);
		this.useGM = options.graphicsMagick || false;
		this.combinedImage = options.combinedImage || false;

		this.outputDirectory = options.outputDirectory || path.dirname(pdfFilePath);
		this.outputThumbnailDirectory =
			options.outputThumbnailDirectory || path.join(path.dirname(pdfFilePath), 'thumbnails');
	}
	constructGetInfoCommand() {
		return `pdfinfo "${this.pdfFilePath}"`;
	}
	parseGetInfoCommandOutput(output) {
		const info = {};
		output.split('\n').forEach(function (line) {
			if (line.match(/^(.*?):[ \t]*(.*)$/)) {
				info[RegExp.$1] = RegExp.$2;
			}
		});
		return info;
	}

	getInfo() {
		const self = this;
		const getInfoCommand = this.constructGetInfoCommand();
		const promise = new Promise(function (resolve, reject) {
			exec(getInfoCommand, function (err, stdout, stderr) {
				if (err) {
					return reject({
						message: "Failed to get PDF'S information",
						error: err,
						stdout: stdout,
						stderr: stderr,
					});
				}
				return resolve(self.parseGetInfoCommandOutput(stdout));
			});
		});
		return promise;
	}
	numberOfPages() {
		return this.getInfo().then(function (info) {
			return info['Pages'];
		});
	}
	getOutputImagePathForPage(pageNumber) {
		return path.join(this.outputDirectory, this.pdfFileBaseName + '-' + pageNumber + '.' + this.convertExtension);
	}
	getOutputThumbnailPathForImage(pageNumber) {
		return path.join(
			this.outputThumbnailDirectory,
			this.thumbnailFileBaseName + '-' + pageNumber + '.' + this.convertExtension
		);
	}
	getOutputImagePathForFile() {
		return path.join(this.outputDirectory, this.pdfFileBaseName + '.' + this.convertExtension);
	}
	setConvertOptions(convertOptions) {
		this.convertOptions = convertOptions || {};
	}
	setPdfFileBaseName(pdfFileBaseName) {
		this.pdfFileBaseName = pdfFileBaseName || path.basename(this.pdfFilePath, '.pdf');
	}
	setThumbnailFileBaseName(thumbnailFileBaseName) {
		this.thumbnailFileBaseName = thumbnailFileBaseName || path.basename(this.pdfFilePath, '.pdf');
	}
	setConvertExtension(convertExtension) {
		this.convertExtension = convertExtension || 'png';
	}
	constructConvertCommandForPage(pageNumber) {
		const pdfFilePath = this.pdfFilePath;
		const outputImagePath = this.getOutputImagePathForPage(pageNumber);
		const convertOptionsString = this.constructConvertOptions();
		return `${this.useGM ? 'gm convert' : 'convert'} ${
			convertOptionsString ? convertOptionsString + ' ' : ''
		}"${pdfFilePath}[${pageNumber}]" "${outputImagePath}"`;
	}
	constructConvertImageToThumbnailCommand(pageNumber) {
		const imagePath = this.getOutputImagePathForPage(pageNumber);
		const outputThumbnailPath = this.getOutputThumbnailPathForImage(pageNumber);
		return `${this.useGM ? 'gm convert' : 'convert'} "${imagePath}" -thumbnail "80x45>" "${outputThumbnailPath}"`;
	}
	constructCombineCommandForFile(imagePaths) {
		return `${this.useGM ? 'gm convert' : 'convert'} -append ${imagePaths.join(
			' '
		)} "${this.getOutputImagePathForFile()}"`;
	}
	constructConvertOptions() {
		return Object.keys(this.convertOptions)
			.sort()
			.map(function (optionName) {
				if (this.convertOptions[optionName] !== null) {
					return optionName + ' ' + this.convertOptions[optionName];
				} else {
					return optionName;
				}
			}, this)
			.join(' ');
	}
	combineImages(imagePaths) {
		const pdfImage = this;
		const combineCommand = pdfImage.constructCombineCommandForFile(imagePaths);
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
				return resolve(pdfImage.getOutputImagePathForFile());
			});
		});
	}
	convertFile() {
		const pdfImage = this;
		return new Promise(function (resolve, reject) {
			pdfImage.numberOfPages().then(function (totalPages) {
				const convertPromise = new Promise(function (resolve, reject) {
					const imagePaths = [];
					for (let i = 0; i < totalPages; i++) {
						pdfImage
							.convertPage(i)
							.then(function (imagePath) {
								imagePaths.push(imagePath);
								if (imagePaths.length === parseInt(totalPages)) {
									// Ensure that filenames are sorted naturally (numerically)
									imagePaths.sort(function (a, b) {
										a = a.split('-');
										a = a[a.length - 1].split('.')[0];
										b = b.split('-');
										b = b[b.length - 1].split('.')[0];
										return a - b;
									}); //because of asyc pages we have to reSort pages
									resolve(imagePaths);
								}
							})
							.catch(function (error) {
								reject(error);
							});
					}
				});

				convertPromise
					.then(function (imagePaths) {
						if (pdfImage.combinedImage) {
							pdfImage.combineImages(imagePaths).then(function (imagePath) {
								resolve(imagePath);
							});
						} else {
							resolve(imagePaths);
						}
					})
					.catch(function (error) {
						reject(error);
					});
			});
		});
	}
	convertPage(pageNumber) {
		const pdfFilePath = this.pdfFilePath;
		const outputImagePath = this.getOutputImagePathForPage(pageNumber);
		const convertCommand = this.constructConvertCommandForPage(pageNumber);
		const convertToThumbnailCommand = this.constructConvertImageToThumbnailCommand(pageNumber);

		const promise = new Promise(function (resolve, reject) {
			function convertImageToThumbnail() {
				exec(convertToThumbnailCommand, function (err, stdout, stderr) {
					if (err) {
						return reject({
							message: 'Failed to convert image to thumbnail',
							error: err,
							stdout: stdout,
							stderr: stderr,
						});
					}
					return resolve(outputImagePath);
				});
			}

			function convertPageToImageAndThumbnail() {
				exec(convertCommand, function (err, stdout, stderr) {
					if (err) {
						return reject({
							message: 'Failed to convert page to image',
							error: err,
							stdout: stdout,
							stderr: stderr,
						});
					}
					return convertImageToThumbnail();
				});
			}

			fs.stat(outputImagePath, function (err, imageFileStat) {
				const imageNotExists = err && err.code === 'ENOENT';
				if (!imageNotExists && err) {
					return reject({
						message: 'Failed to stat image file',
						error: err,
					});
				}

				// convert when (1) image doesn't exits or (2) image exists
				// but its timestamp is older than pdf's one

				if (imageNotExists) {
					// (1)
					convertPageToImageAndThumbnail();
					return;
				}

				// image exist. check timestamp.
				fs.stat(pdfFilePath, function (err, pdfFileStat) {
					if (err) {
						return reject({
							message: 'Failed to stat PDF file',
							error: err,
						});
					}

					if (imageFileStat.mtime < pdfFileStat.mtime) {
						// (2)
						convertPageToImageAndThumbnail();
						return;
					}

					return resolve(outputImagePath);
				});
			});
		});
		return promise;
	}
}

module.exports = PDFImage;
