import {module} from 'angular';

const app = module('myApp', []);

class LoginFormController {
  constructor() {
    console.log('logforrm ctrl');
  }
}

const LoginFormComponent = {
  bindings: {},
  controller: LoginFormController,
  template: `<div>Foo</div>`,
}

app.component('loginForm', LoginFormComponent);
