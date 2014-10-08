// Copyright (C) 2007-2013, GoodData(R) Corporation. All rights reserved.
//define(['../integration'], function() {

    var Green = Em.Application.extend(Em.Nesting.ComponentAppMixin, {
        name: 'Green'

        , LOG_TRANSITIONS: true // basic logging of successful transitions
        //, LOG_TRANSITIONS_INTERNAL: true // detailed logging of all routing steps
    });

    Green.initApp = function() {
        // custom application instance initialization

        // declare ExternalAppRoute routes...
        this.Router.map(function() {
            this.route('red');
        });
        this.RedRoute = Em.Nesting.ExternalAppRoute.extend();
    };

    // Externalize routemap
    Green.RouteMap = function() {
        this.route('grass');
        this.route('trees');
    };

    Green.ApplicationView = Em.View.extend({
        tagName: 'span',
        classNames: ['app-green'],
        template: Em.Handlebars.compile(
        '<h1>Green</h1>'+

        '{{#link-to "red"}}red{{/link-to}}<br>'+

        '{{#link-to "grass"}}grass{{/link-to}}<br>' +
        '{{#link-to "trees"}}trees{{/link-to}}' +

        '{{outlet}}'
        )
    });

    Green.GrassView = Em.View.extend({
        template: Em.Handlebars.compile(
            '<h1>Grass</h1>'+
            '{{#link-to "trees"}}trees{{/link-to}}'
        )
    });

    Green.TreesView = Em.View.extend({
        template: Em.Handlebars.compile(
            '<h1>Trees</h1>'+
            '{{#link-to "grass"}}grass{{/link-to}}'
        )
    });

//    return Green;
//});

