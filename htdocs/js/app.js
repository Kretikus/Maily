
var RMIImpl = function() {
    this.wsOpen = false;
    this.ws = new WebSocket("ws://localhost:8889");
    var that = this;

    this.clearCurrentRequest = function() {
        this.successCallback = null;
        this.failCallback = null;
        this.cmd = '';
    };

    this.ws.onopen = function() {
        console.log("Socket Open!");
        that.wsOpen = true;
        that.clearCurrentRequest();
    };

    this.ws.onerror = function() {
        if (that.failCallback) failCallback();
        that.clearCurrentRequest();
    };

    this.ws.onclose = function() {
        if (that.failCallback) failCallback();
        that.clearCurrentRequest();
    };

    this.ws.onmessage = function(evt) {
        var reply = JSON.parse(evt.data);
        if (reply['cmd'] === that.cmd) {
            if (that.successCallback) that.successCallback(reply['reply']);
        } else {
            if (that.failCallback) that.failCallback();
        }
        that.clearCurrentRequest();
    };

    this.send = function(cmd, data, successCallback, failCallback) {
        this.successCallback = successCallback;
        this.failCallback = failCallback;
        this.cmd = cmd;
        var payload = {
            "cmd": cmd,
            "params": data
        };

        this.ws.send(JSON.stringify(payload));
    };
  };

var RMI = new RMIImpl();

App = Ember.Application.create();

App.Router.map(function() {
    this.resource('inbox');
});

App.ApplicationController = Ember.Controller.extend({
    isLoggedIn: false,

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

            RMI.send("login", this.getProperties("username", "password"), this.success.bind(this), this.failure.bind(this));
        }
    },

    success: function(reply) {
        this.reset();
        if (reply === 1) {
            this.set("isLoggedIn", true);
        } else {
            this.set("loginFailed", true);
        }
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


App.InboxRoute = Ember.Route.extend({
    model: function() {
        console.log("Returning IndexModel");
        return {};
        RMI.send("openInbox",
    }
});

