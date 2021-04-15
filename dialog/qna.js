const { QnAMaker } = require('botbuilder-ai');
const { Dialog } = require('botbuilder-dialogs');

const qnaMaker = new QnAMaker({
    knowledgeBaseId: process.env.QnAKnowledgebaseId,
    endpointKey: process.env.QnAEndpointKey,
    host: process.env.QnAEndpointHostName
});


class QnADialog extends Dialog{

    //qna approch
    async processSampleQnA(context) {
        console.log('processSampleQnA');

        const results = await qnaMaker.getAnswers(context);
        console.log(results);

        if (results.length > 0) {
            await context.sendActivity(`${ results[0].answer }`);
        } else {
            await context.sendActivity('Sorry, could not find an answer in the Q and A system.');
        }
    }
}

module.exports.QnADialog = QnADialog;