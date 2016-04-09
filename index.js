import {module} from 'angular';
import ngRedux from 'ng-redux';
import ngReduxDevTools from 'ng-redux-dev-tools';
import { combineReducers } from 'redux';
import { v1 } from 'uuid';
import ngMockE2E from 'angular-mocks/ngMockE2E';


const app = module('myApp', [ngRedux, ngReduxDevTools, ngMockE2E]);

app.run(function mockApi ($httpBackend) {
  'ngInject';

  $httpBackend.whenPOST(/lists\/(\w+)\/emails/, /.*/, undefined, ['listId']).respond((method, url, data, headers, params) => {
    let entity = JSON.parse(data);
    entity.listId = params.listId;

    switch(entity.email) {
      case 'foo@bar.tld':
        return [400, {
          errors: ['unacceptable email because duh'],
        }];
      case 'foo@bar':
        return [500, "Ooops"];
      default:
        return [201, entity];
    }
  });
});

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
      const params = { id, email };
      this.$http.post(`/lists/${list.id}/emails`, params)
        .then(res => dispatch(this.emailAdded(id, res.data)))
        .catch(res => dispatch(this.failToAdd(id, res.data.errors)));
    };
  }
  emailAdded(id, subscription) {
    return {
      type: actions.EMAIL_ADDED,
      id,
      subscription,
    };
  }
  failToAdd(id, errors) {
    return {
      type: actions.FAIL_TO_ADD,
      id,
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
      console.log('EMAIL_ADDED', state, action);
      return Object.assign({}, state, {
        [action.id]: Object.assign({}, state[action.id], {
          loading: false,
          errors: [],
        }),
      });
    case actions.FAIL_TO_ADD:
      return Object.assign({}, state, {
        [action.id]: Object.assign({}, state[action.id], {
          loading: false,
          errors: action.errors,
        }),
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

const thunk = store => next => action => {
  if (typeof action === 'function') {
    return action(store.dispatch, store.getState);
  }

  return next(action);
};

//-------------------
// CONFIG
app.config(function ($ngReduxProvider, devToolsServiceProvider) {
  'ngInject';
  $ngReduxProvider.createStoreWith(reducer, [thunk], [devToolsServiceProvider.instrument()]);
});

//-------------------
// COMPONENTS
class SignUpFormController {
  constructor($scope, SignupActions, $ngRedux) {
    'ngInject';
    this.SignupActions = SignupActions;
    this.$ngRedux = $ngRedux;
    this.init();
    $scope.$on('$destroy', $ngRedux.subscribe(() => {
        const state = $ngRedux.getState();
        const selected = state.SignupListReducer.listById[this.id];
        if (!!selected && !selected.loading) {
          this.errors = selected.errors;

          if (selected.errors.length === 0) {
            this.init();
          }
        }
    }));
  }
  init() {
    this.id = v1();
    this.email = '';
  }
  signup() {
    this.$ngRedux.dispatch(this.SignupActions.addEmailToList(this.id, this.list, this.email));
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
      <div ng-if="!!$ctrl.errors" class="alert">
        <p ng-repeat="error in $ctrl.errors">
          {{ error }}
        </p>
      </div>
      <div class="form-group">
        <label>email</label>
        <input type="email" ng-model="$ctrl.email" required />
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
    <h2>Sign Up to <trong>B</strong></h2>
    <signup-form list="{name: 'B', id: 'b'}"></signup-form>
  `
});
