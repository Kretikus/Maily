App = Ember.Application.create();

App.IndexController = Ember.Controller.extend({

  loginFailed: false,
  isProcessing: false,
  isSlowConnection: false,
  timeout: null,

  actions: {
	  login: function() {
	    this.setProperties({
	      loginFailed: false,
	      isProcessing: true
	    });

	    this.set("timeout", setTimeout(this.slowConnection.bind(this), 250));

	    var request = $.post("/login", this.getProperties("username", "password"));
	    request.then(this.success.bind(this), this.failure.bind(this));
	  },
  },

  success: function() {
    console.log('---------', arguments);
    this.reset();
    // sign in logic
  },

  failure: function() {
    this.reset();
    this.set("loginFailed", true);
  },

  slowConnection: function() {
    this.set("isSlowConnection", true);
  },

  reset: function() {
    clearTimeout(this.get("timeout"));
    this.setProperties({
      isProcessing: false,
      isSlowConnection: false
    });
  }

});