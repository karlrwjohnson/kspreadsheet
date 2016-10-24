import ApplicationController from './controller/ApplicationController';

// Globals
const applicationController = new ApplicationController();

// Build page
document.body.appendChild(applicationController.element);

console.log('ok');
