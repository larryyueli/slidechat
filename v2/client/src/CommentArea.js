import React from 'react';
import Box from '@material-ui/core/Box';
import ExpansionPanel from '@material-ui/core/ExpansionPanel';
import ExpansionPanelSummary from '@material-ui/core/ExpansionPanelSummary';
import ExpansionPanelDetails from '@material-ui/core/ExpansionPanelDetails';
import Typography from '@material-ui/core/Typography';

class CommentArea extends React.Component {
    
    render() {
        return (
            <Box>
                <ExpansionPanel>
                    <ExpansionPanelSummary>
                        <Typography>
                            What is the question?
                        </Typography>
                    </ExpansionPanelSummary>
                    <ExpansionPanelDetails>
                        <Typography>
                            This is answer to this question. I'm sure it is working.
                        </Typography>
                    </ExpansionPanelDetails>
                    <ExpansionPanelDetails>
                        <Typography>
                            Another answer.
                        </Typography>
                    </ExpansionPanelDetails>
                </ExpansionPanel>

                <ExpansionPanel>
                <ExpansionPanelSummary>
                    <Typography>
                        Second question?
                    </Typography>
                </ExpansionPanelSummary>
                <ExpansionPanelDetails>
                    <Typography>
                        Another answer to the same question.
                    </Typography>
                </ExpansionPanelDetails>
                </ExpansionPanel>

                <ExpansionPanel>
                <ExpansionPanelSummary>
                    <Typography>
                        Three questions.
                    </Typography>
                </ExpansionPanelSummary>
                <ExpansionPanelDetails>
                    <Typography>
                        Another answer to the same question.
                    </Typography>
                </ExpansionPanelDetails>
                </ExpansionPanel>
            </Box>
        );
    }
}

export default CommentArea;
