import {module} from 'angular';
import ngRedux from 'ng-redux';
import ngReduxDevTools from 'ng-redux-dev-tools';
import { combineReducers } from 'redux';

const app = module('myApp', [ngRedux, ngReduxDevTools]);


//-------------------
// ACTIONS
const actions = {
  SIGNUP: 'SIGNUP',
  SUBMIT_EMAIL: 'SUBMIT_EMAIL',
  EMAIL_ADDED: 'EMAIL_ADDED',
  FAIL_TO_ADD: 'FAIL_TO_ADD',
};

class SignupActions {
  constructor($http) {
    'ngInject';
    this.$http = $http;
  }
  addEmailToList(id, list, email) {
    return (dispatch) => {
      dispatch({
        type: actions.SUBMIT_EMAIL,
        id,
        list,
        email,
      });
      this.$http.post(`/lists/${list.id}/emails`, { id, email })
        .then(res => dispatch(this.emailAdded(res.json)))
        .catch(res => dispatch(this.failToAdd(res.json)));
    };
  }
  emailAdded(subscription) {
    return {
      type: actions.EMAIL_ADDED,
      subscription,
    };
  }
  failToAdd(errors) {
    return {
      type: actions.FAIL_TO_ADD,
      errors,
    };
  }
}

app.service('SignupActions', SignupActions);

//-------------------
// REDUCERS
const SignListByIdReducer = (state = { }, action) => {
  switch (action.type) {
    case actions.SUBMIT_EMAIL:
      return Object.assign({}, state, {
        [action.id]: {
          id: action.id,
          email: action.email,
          list: action.list,
          loading: true,
          errors: [],
        }
      });
    case actions.EMAIL_ADDED:
      return Object.assign({}, state, {
        [action.id]: {
          id: action.id,
          email: action.email,
          list: action.list,
          loading: false,
          errors: [],
        }
      });
    case actions.FAIL_TO_ADD:
      return Object.assign({}, state, {
        [action.id]: {
          id: action.id,
          email: action.email,
          list: action.list,
          loading: false,
          errors: action.errors,
        }
      });
    default:
      return state;
  }
};

const SignupListReducer = (state = {
  listById: {}
}, action) => {
  switch (action.type) {
    case actions.SUBMIT_EMAIL:
    case actions.EMAIL_ADDED:
    case actions.FAIL_TO_ADD:
      return Object.assign({}, state, { listById: SignListByIdReducer(state.listById, action)})
    default:
      return state;
  }
};

const reducer = combineReducers({ SignupListReducer });


//-------------------
// MIDDLEWARES

//-------------------
// CONFIG
app.config(function ($ngReduxProvider, devToolsServiceProvider) {
  'ngInject';
  $ngReduxProvider.createStoreWith(reducer, [], [devToolsServiceProvider.instrument()]);
});

//-------------------
// COMPONENTS
class SignUpFormController {
  constructor() {
    'ngInject';
  }
  signup() {
    console.log('signup action');
  }
}

app.component('signupForm', {
  bindings: {
    list: '<',
  },
  controller: SignUpFormController,
  template: `
    <form ng-submit="$ctrl.signup()" name="signup">
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
