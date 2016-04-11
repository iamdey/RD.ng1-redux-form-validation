# R&D Form validation with Angular 1 and Redux

This repository is a Proof Of Concept of Form validation.

With redux the old good way to do things is a bit different. You are probably here because of this.

The initial problems:

* When should I display errors
* What if there is many forms
* So where to store errors given by server

## Install and usage

```
npm i
npm run dev
npm start
```

_dev script must be executed each time you change something_

## Explanations

_[TL;DR]: All depends on the shape of the state._

This article has been written with angular 1.5.
All the things you'll see are in the `index.js` file right here.

_(Thanks to @jubianchi to make my vision complete)_

### The project

We have a simple page with a form witch receive an email in order to subscribe to a list.
May be we will have many lists and many emails.

### The App

Here we start with a fake api that will respond 201 with to posted data except for emails `foo@bar.tld` and `foo@bar`.
Unfortunately I didn't deal with 500 error but it can be easily done with [angular http interceptors](https://docs.angularjs.org/api/ng/service/$http#interceptors)

```
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
```

### Redux actions

There are 3 useful actions:

* `SUBMIT` is launched by the user
* `ADDED and FAIL` are launched in reception of the server data.

Take a look at the `id` of the subscription that will help us to know where to store errors

```
const actions = {
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
```

### Redux reducers

Don't forget: "pure functions".
With `submit` action we initialize a subscription and set state to loading. When server respond we
stop loading and so we know if it has been persisted are not depends on `errors.length`.

```
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
```

_(see index.js if you need to see how to combine reducers)_
_(see index.js if you need to see how are configured ngRedux and redux middlewares)_

### Angular 1 components

See the `id` I was talking about. So yes it has been generated here and can be done differently. The
important thing is to make sure you can retrieve your state when you subscribe to redux thanks to
the "selector" (I usually use [reselect](https://github.com/reactjs/reselect) in order to do that).

```
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
```

Of course I didn't explained how to validate form on the client side, the
[official documentation](https://docs.angularjs.org/guide/forms) should be enough.

### The main component

And then we can append all the forms we want, all are totally isolated.

```
app.component('page', {
  template: `
    <h1>Welcome and signup OKay?!</h1>
    <h2>Sign Up to <trong>A</strong></h2>
    <signup-form list="{name: 'A', id: 'a'}"></signup-form>
    <h2>Sign Up to <trong>B</strong></h2>
    <signup-form list="{name: 'B', id: 'b'}"></signup-form>
  `
});
```

## Final Though

I didn't used middlewares to do anything except almost standard thunk operations and may be it could
helps in our case for example with the `id` I had to pre-generate before the subscription is
persisted.

Also I didn't put any clue on how to unit test this case. But we need to focus, in order to prevent
regression on the feature, I should have to start with an End-To-End functional test. Anyway, I use
this as a draft, I know now where to go, it will be easier to do some TDD.

Hope you find some answers here. You may have notice this guide can also help to learn redux in the
async world within angular 1.
