import {module} from 'angular';

const app = module('myApp', []);

class SignUpFormController {
  constructor() {
    console.log('logforrm ctrl');
  }
}

app.component('signupForm', {
  bindings: {
    list: '<',
  },
  controller: SignUpFormController,
  template: `
    <form ng-submit="$ctrl.signup() name="signup">
      <p>form for {{ $ctrl.list.name }}</p>
      <div class="form-group">
        <label>email</label>
        <input type="email" required />
      </div>
      <div>
        <button type="submit" class="btn btn-primary"><i class="fa fa-add"></i>Add</submit>
      </div>
    </form>`,
});

app.component('page', {
  template: `
    <h1>Welcome and signup OKay?!</h1>
    <h2>Sign Up to <trong>A</strong></h2>
    <signup-form list="{name: 'A', id: 'a'}"></signup-form>
  `
});
