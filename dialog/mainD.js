const { Dialog } = require('botbuilder-dialogs');
const { LuisRecognizer, QnAMaker } = require('botbuilder-ai');
const { CardFactory  } = require('botbuilder');
const { ActionTypes } = require('botframework-schema');

var { solutionText } = require('./solutionD');
var { clean } = require('./cancelAndHelpD');

const axios = require('axios').default;
//Dialogs define
const { SolutionDialog } = require('./solutionD');
const { QnADialog } = require('./qna');

const qna = new QnADialog();


// const dispatchRecognizer = new LuisRecognizer({
//     applicationId: process.env.LuisAppId,
//     endpointKey: process.env.LuisAPIKey,
//     endpoint: `https://${ process.env.LuisAPIHostName }.api.cognitive.microsoft.com`
// }, {
//     includeAllIntents: true,
//     includeInstanceData: true,
//     apiVersion: 'v3'
// }, true);

let azureSearch = {
    searchKey: process.env.searchKey,
    searchIndex: process.env.searchIndex,
    searchEndpoint: process.env.searchEndpoint
}

// this.dispatchRecognizer = dispatchRecognizer;

//Az Search
searchURL = azureSearch.searchEndpoint + "/indexes/" + azureSearch.searchIndex + "/docs?api-version=2020-06-30-Preview&search=";
searchHeaders = {'api-key': azureSearch.searchKey};

class MainDialog extends Dialog{
    constructor(conversationState, userState,userprofileName,context,accessor){
        super();
        // this.check(userprofileName,userState,context,accessor)
    }
    
    
    async check(userprofileName,userState,context,accessor,dispatchRecognizer){
        // First, we use the dispatch model to determine which cognitive service (LUIS or QnA) to use.
        const recognizerResult = await dispatchRecognizer.recognize(context);
        // Top intent tell us which cognitive service to use.
        var intent = LuisRecognizer.topIntent(recognizerResult);

        if(solutionText() == "solution" && clean() != "clean"){
            intent = 'solutions';
        };

        switch (intent) {
            case 'about':
                await context.sendActivity('about');
                break;
            case 'Greeting':
                await qna.processSampleQnA(context);//qnaAccess
                break;
            case 'industry':
                await this.IndustryCard(context);
                break;
            case 'solutions':{
                if(!userprofileName){
                    const solutionD = new SolutionDialog(userState);
                    return await solutionD.run(context,accessor);
                }
                else{
                    return await context.sendActivity('Done!');
                }
                
            }
            case 'product'://az search
                console.log(recognizerResult);
                const entity = recognizerResult.entities['product_name'];
                console.log(entity);
                
                let processSearchURL = searchURL + entity;
                let options = {
                    headers: searchHeaders
                }
                
                try{
                    const response = await axios.get(processSearchURL,options);
                    const data = response.data;
                    // console.log(data);
                    // console.log(data.value[0].ListPrice);
                    return await context.sendActivity("Search Results: " + JSON.stringify(data.value[0].ListPrice))
                }catch (error){
                    console.log(error);
                }
                
                
            default:

                break;
        }

    }

    //simple industry details card
    async IndustryCard(context) {
        const card = CardFactory.heroCard(
            'Main Business Details',
            'Find more about Industry Details.....',
            ['https://3er1viui9wo30pkxh1v2nh4w-wpengine.netdna-ssl.com/wp-content/uploads/prod/sites/43/2020/06/Fortude-AI4A-Sri-Lanka.jpg'],
            [
                {
                    type: ActionTypes.OpenUrl,
                    title: 'Fashion',
                    value: 'https://fortude.co/infor-fashion/'
                },
                {
                    type: ActionTypes.OpenUrl,
                    title: 'Food & Beverage',
                    value: 'https://fortude.co/food-beverage-erp-solutions/'
                },
                {
                    type: ActionTypes.OpenUrl,
                    title: 'Manufacturing & Distribution',
                    value: 'https://fortude.co/infor-manufacturing/'
                },
                {
                    type: ActionTypes.OpenUrl,
                    title: 'Healthcare',
                    value: 'https://fortude.co/healthcare/'
                }
            ]
        );
    
        await context.sendActivity({ attachments: [card] });
    }
}

module.exports.MainDialog = MainDialog;