// Copyright (C) 2007-2013, GoodData(R) Corporation. All rights reserved.
//define(['./bower_components/ember/ember'], function() {

    Em.Nesting = {};

    //=== TODO ===
    //
    //*** Location handling
    //
    // Perhaps we might want to attempt to replace the 'none' location with
    // something which would take the rest of the URL from an existing route
    // and pass it to the nested ComponentApp instance to be able to
    // transparently navigate to different nested app routes directly
    // This would make the URL bookmarkable
    //

    // avoid setup jQuery delegates
    var NestedApplicationEventDispatcher = Em.EventDispatcher.extend({
        setup: function() {
            // no-op, nested
        }
    });

    /**
     * A mixin adjustin a ComponentApp so that it can be rendered into
     * a ComponentAppView inside another application
     **/
    var NestedApplicationMixin = Em.Mixin.create({
        init: function() {
            this._super();
            this.deferReadiness();

            this._nestedRouting();
            this._patchApplicationView();

            this.register('event_dispatcher:main', NestedApplicationEventDispatcher);
        },

        _nestedRouting: function() {
            // TODO: Perhaps we want to propagate part of the URL
            //       to the ComponentApp
            this.Router.reopen({
                location: 'none'
            });
            this.Router.map(this.constructor.RouteMap);
        },

        // note: hacky dirty override, as we don't really care here
        // to avoid the following assert in the Em.View#appendTo
        // (see https://github.com/emberjs/ember.js/issues/1190)
        //
        // Ember.assert("You cannot append to an existing Ember.View. Consider using Ember.ContainerView instead.", !Ember.$(target).is('.ember-view') && !Ember.$(target).parents().is('.ember-view'));
        _patchApplicationView: function(app) {
            this.__container__.lookupFactory('view:application').reopen({
                appendTo: function(target) {
                    this._insertElementLater(function() {
                        this.$().appendTo(target);
                    });
                    return this;
                }
            });
        }
    });

    /**
     * As the ComponentApp codebase is developed so that the classes are put
     * into its own global namespace in the form of a Em.Application subclass
     * the Em.Resolver needs to be adjusted to look for class properties as
     * well as opposed to just instance properties.
     *
     * Lookup order is as follows
     *   - Namespace (standard in Em.DefaultResolver)
     *   - Namespace.constructor (our extension)
     **/
    var ConstructorResolverMixin = Em.Mixin.create({

        // customize the LOG_RESOLVER to start with app guid output
        lookupDescription: function(fullName) {
            var parsedName = this.parseName(fullName);
            return Em.guidFor(parsedName.root) + ':'+
                   this._super(fullName);
        },

        /**
         * Generic resolution method customized to look into the:
         *
         *   - Namespace (standard in Em.DefaultResolver)
         *   - Namespace.constructor (the required extension)
         **/
        resolveOther: function(parsedName) {
            //this._super.apply(this, arguments);
            //-inlined\
            var classify = Em.String.classify;
            var get = Em.get;

            var className = classify(parsedName.name) + classify(parsedName.type),
                factory = get(parsedName.root, className);
            if (factory) { return factory; }
            //-inlined/

            // Check the Namespace.constructor as well
            var constr = parsedName.root.constructor;
            factory = constr && constr[className];
            if (factory) { return factory; }
        }
    });

    /**
     * App-contextualize the Em.Handlebars.register(Bound)Helper methods.
     *
     * Ember Handlebars helpers are generally put into a global
     * Em.Handlebars.helpers container. This could create conflicts when
     * merging multiple ComponentApp codebases into a single Slice.
     * The helpers could however be put into the application container.
     *
     * For example instead of Em.Handlebars.registerBoundHelper('name', fn)
     * use application container helper registration methods:
     *
     * note: name must contain a dash in order to get looked up in the
     *       application container. Therefore some prefix use is recommended
     *
     *    Em.Application.extend().initApp(function() {
     *        this.registerBoundHelper('name-with-dashes', boundFn);
     *    })
     **/
    var HandlebarsHelpersMixin = Em.Mixin.create({
        registerHelper: function registerHandlebarsHelper(name, fn) {
            this.register('helper:'+name, fn);
        },
        registerBoundHelper: function registerBoundHandlebarsHelper(name, fn) {
            var boundHelperArgs = [].slice.call(arguments, 1),
                boundFn = Em.Handlebars.makeBoundHelper.apply(this, boundHelperArgs);
            this.registerHelper(name, boundFn);
        }
    });

    /**
     * Component application mixin.
     *
     * Adjusts the resolver so that the application class doesn't have
     * to be instantiated.
     *
     * Provides a appClass#initApp() initializer-time method that is executed
     * after the application class is instantiated.
     *
     * For example the common Em.Application.create().register(...) use needs
     * to be deferred there is an application instance available in general
     * as follows:
     *
     *   Em.Application.extend().initializer({
     *       initialize: function(container, app) {
     *            app.register(...
     *        }
     *   })
     *
     *   Em.Application.extend().initApp(function() {
     *       this.register(...
     *   })
     *
     * Also calls Router.map with the appClass#RouteMap to keep route mapping
     * declarative.
     **/
    Em.Nesting.ComponentAppMixin = Em.Mixin.create(HandlebarsHelpersMixin, {
        init: function() {
            this._super();

            this._setupComponentResolver();
            this._setupInitAppInitializer();

            // constructor -> instance resolver config
            this.Router.map(this.constructor.RouteMap);
        },

        _setupComponentResolver: function() {
            var container = this.__container__,
                resolver = container.resolver.__resolver__;

            ConstructorResolverMixin.apply(resolver);

            this.LOG_RESOLVER = true;
        },

        _setupInitAppInitializer: function () {
            var appClass = this.constructor;

            if (appClass._hasInitAppInitializer) return;
            appClass._hasInitAppInitializer = true;

            if (appClass.initApp) {
                // schedule to do only inside the sceduled
                // Em.Application._initialize (after the advanceReadiness()
                appClass.initializer({
                    name: 'component-initApp',
                    initialize: function(container, app) {
                        // custom initializers, registrations etc.
                        app.constructor.initApp.call(app);
                    }
                });
            }
        }
    });

    /**
     * Em.View subclass for embedding an inline ComponentApp use.
     *
     * It instantiates the appClass and initializes it inside the view's DOM
     * element.
     **/
    Em.Nesting.ComponentAppView = Em.View.extend({
        appName: 'component',
        appClass: Em.Application,

        _createComponentAppFactory: function(appClass) {
            return {
                create: function() {
                    return appClass.createWithMixins(NestedApplicationMixin);
                }
            };
        },

        didInsertElement: function() {
            this._super();

            var container = this.get('container'),
                appClass = this.get('appClass');

            // Em.Application.create() with all the setup etc.
            var containerAppName = 'app:'+this.get('appName');
            if (!container.has(containerAppName)) {
                var appFactory = this._createComponentAppFactory(appClass);

                container.register(containerAppName,
                                   appFactory, { singleton: false });
            }
            var app = container.lookup(containerAppName);

            var parentApp = container.lookup('router:main').get('namespace');
            parentApp.nest(app); // setup routes
            app.register('application:parent', parentApp, { instantiate: false });

            app.reopen({
                rootElement: this.$()
            });
            app.advanceReadiness();
        }
    });

    /**
     * Slice internal external route implementation.
     *
     * FIXME: Em.Nesting.TargetAppRoute is just an optimization of Em.Nesting.ExternalAppRoute
     *        Currently not used... REMOVE?
     **/
    Em.Nesting.TargetAppRoute = Em.Route.extend({
        beforeModel: function(transition) {
            transition.abort();

            var targetApp = this.get('targetApp');

            // get the parent application instance if no targetApp present
            targetApp = targetApp || this.get('container').lookup('application:parent');

            var router = targetApp.__container__.lookup('router:main');
            router.transitionTo(this.get('routeName'));
        }
    });

    /**
     * External route implementation.
     *
     * A ComponentApp would use this class to declare the route is to do
     * a parent application transition.
     **/
    Em.Nesting.ExternalAppRoute = Em.Route.extend({
        beforeModel: function(transition) {
            // avoid ComponentApp inner transition to external routes
            transition.abort();

            window.parent.postMessage({gdc:{
                name: 'transitionTo',
                data: {
                    routeName: this.get('routeName')
                }
            }}, '*');
        }
    });

    /**
     * A communication mixin.
     *
     * Currently receiving and handling external route transitions.
     **/
    var IntegrationAppCommunicationMixin = Em.Mixin.create({
        init: function() {
            this._super();

            Em.$(window).on('message.integration.' + Em.guidFor(this),
                            this._processIncommingMessage.bind(this));

        },

        willDestroy: function() {
            Em.$(window).off('message.integration.' + Em.guidFor(this));

            this._super();
        },

        _processIncommingMessage: function(event) {
            try {
                var message;
                if (typeof event.originalEvent.data === 'string') {
                    message = JSON.parse(event.originalEvent.data).gdc;
                } else {
                    message = (event.originalEvent.data || {}).gdc;
                }
                if (!message) return;

                if (message.handleEvent) {
                    this.resolveMessage(message.handleEvent);
                } else {
                    var source = event.originalEvent.source;
                    this._message(message.name, message.data, source);
                }
            } catch(ignore) {}
        },

        // message dispatch
        _message: function(name, data, source) {
            console.log('_message', name, data);

            if (name === 'transitionTo') {
                return this.onTransitionToMessage(data);
            }
        }
    });

    /**
     * A mixin facilitating nested ComponentApp communication bridge
     * and routing setup.
     **/
    Em.Nesting.IntegrationAppMixin = Em.Mixin.create(IntegrationAppCommunicationMixin, {
        onTransitionToMessage: function(data) {
            var router = this.__container__.lookup('router:main');
            return router.transitionTo(data.routeName);
        },

        // inject all IntegrationApp routes into the ComponentApp
        nest: function nestRoutes(app) {
            app.Router.map(this.constructor.RouteMap);
        }
    });
//});

