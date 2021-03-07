import { useState } from 'react';
import { ClickAwayListener } from '@material-ui/core';
import { GithubPicker } from 'react-color';

export const palette = ['#ff0000', '#FFA500', '#FCCB00', '#008B02', '#006B76', '#004DCF', '#5300EB', '#000000'];

const ColourPicker = ({ setColour, currentColour }) => {
	const [open, setOpen] = useState(false);
	const setColourAndClose = (colour) => {
		setColour(colour.hex);
		setOpen(false);
	};
	return (
		<div className='colour-block' style={{ backgroundColor: currentColour }} onClick={() => setOpen(true)}>
			{open ? (
				<ClickAwayListener onClickAway={() => setOpen(false)}>
					<div className='color-picker-wrapper'>
						<GithubPicker colors={palette} onChangeComplete={setColourAndClose} triangle='hide' />
					</div>
				</ClickAwayListener>
			) : null}
		</div>
	);
};
export default ColourPicker;
