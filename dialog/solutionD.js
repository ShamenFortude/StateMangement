const {
    ChoiceFactory,
    ChoicePrompt,
    ComponentDialog,
    ConfirmPrompt,
    DialogSet,
    DialogTurnStatus,
    NumberPrompt,
    TextPrompt,
    WaterfallDialog
} = require('botbuilder-dialogs');

const { Channels } = require('botbuilder-core');
const { UserProfile } = require('../profiles/userProfile');
const { CancelAndHelpDialog } = require('./cancelAndHelpD');


const CHOICE_PROMPT = 'CHOICE_PROMPT';
const CONFIRM_PROMPT = 'CONFIRM_PROMPT';
const NAME_PROMPT = 'NAME_PROMPT';
const NUMBER_PROMPT = 'NUMBER_PROMPT';
const USER_PROFILE = 'USER_PROFILE';
const WATERFALL_DIALOG = 'WATERFALL_DIALOG';
var SOLUTION_TEXT = "";

class SolutionDialog extends CancelAndHelpDialog{
    constructor(userState){
        super('solutionD');
        this.userProfile = userState.createProperty(USER_PROFILE);

        this.addDialog(new TextPrompt(NAME_PROMPT));
        this.addDialog(new ChoicePrompt(CHOICE_PROMPT));
        this.addDialog(new ConfirmPrompt(CONFIRM_PROMPT));

        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
            this.solutionStep.bind(this),
            this.nameStep.bind(this),
            this.nameComfirmStep.bind(this),
            this.emailStep.bind(this),
            this.emailConfirmStep.bind(this),
            this.summaryStep.bind(this)

        ]));

        this.initialDialogId = WATERFALL_DIALOG;

    }
    async run(turnContext, accessor) {
        const dialogSet = new DialogSet(accessor);
        dialogSet.add(this);

        const dialogContext = await dialogSet.createContext(turnContext);
        const results = await dialogContext.continueDialog();
        if (results.status === DialogTurnStatus.empty) {
            await dialogContext.beginDialog(this.id);
        }
    }
    async solutionStep(step){
        SOLUTION_TEXT = 'solution';
        return await step.prompt(CHOICE_PROMPT,{
            prompt: 'Hey Please select the solution that you interest.',
            choices: ChoiceFactory.toChoices(['ERP','Business Intelligance'])
        });
    }
    
    async nameStep(step){
        step.values.solution = step.result.value;
        return await step.prompt(NAME_PROMPT,`Ok... You have selected ${ step.values.solution }. Please enter your name here`);
    }
    async nameComfirmStep(step){
        step.values.name = step.result;
        await step.context.sendActivity(`Thanks ${ step.result }.`);
        return await step.prompt(CONFIRM_PROMPT, 'Do you want to give your email for send our details?',['Yes','No']);
    }
    async emailStep(step){
        if(step.result){
            const prompOptions = {prompt: 'Please enter your email', retryPrompt: 'Please enter valid email'};
            return await step.prompt(NAME_PROMPT,prompOptions);

        }else{
            return await step.next(-1);
        }
        
    }
    async emailConfirmStep(step){
        step.values.email = step.result;
        const msg = step.values.email === -1 ? `Ohh.. you didn't give your email.` : `I have your email as ${ step.values.email }`;

        await step.context.sendActivity(msg);

        return await step.prompt(CONFIRM_PROMPT, {prompt: `Can you confirm you email ${ step.values.email }`});
    }
    async summaryStep(step){
        if(step.result){
            const userProfile = await this.userProfile.get(step.context, new UserProfile());

            userProfile.name = step.values.name;
            userProfile.email = step.values.email;

            await step.context.sendActivity(`We will send you all the information ${ step.values.name }.`);
        }else{
            await step.context.sendActivity('Thanks. Your profile will not be kept.');
        }
        SOLUTION_TEXT = "nothing";
        return await step.endDialog();
    }
    
}

module.exports.SolutionDialog = SolutionDialog;
module.exports.solutionText = function sol(){
        return SOLUTION_TEXT;
};