// Copyright (C) 2007-2013, GoodData(R) Corporation. All rights reserved.
// define(['../integration'], function() {

    var Red = Em.Application.extend(Em.Nesting.ComponentAppMixin, {
        name: 'Red'

        , LOG_TRANSITIONS: true // basic logging of successful transitions
        //, LOG_TRANSITIONS_INTERNAL: true // detailed logging of all routing steps
    });

    Red.initApp = function() {
        // custom application instance initialization
        this.register('helper:test-helper', function() { return "!test-helper"; });

        this.registerBoundHelper('test-k', function() { return "test-k"; });

        // declare ExternalAppRoute routes...
        this.Router.map(function() {
            this.route('green');
        });
        this.GreenRoute = Em.Nesting.ExternalAppRoute.extend();
    };

    Red.RouteMap = function() {
        this.route('bull');
        this.route('carpet');
    };


    Red.ApplicationView = Em.View.extend({
        tagName: 'span',
        classNames: ['app-red'],
        template: Em.Handlebars.compile(
            '<h1>Red</h1>'+

            '{{test-k}}<br>' +

            '{{#link-to "green"}}green{{/link-to}}<br>'+

            '{{#link-to "bull"}}bull{{/link-to}}<br>' +
            '{{#link-to "carpet"}}carpet{{/link-to}}' +

            '{{outlet}}'
        )
    });

    Red.BullView = Em.View.extend({
        template: Em.Handlebars.compile(
            '<h1>Bull</h1>'+
            '{{#link-to "carpet"}}carpet{{/link-to}}'
        )
    });

    Red.CarpetView = Em.View.extend({
        template: Em.Handlebars.compile(
            '<h1>Carpet</h1>'+
            '{{#link-to "bull"}}bull{{/link-to}}'
        )
    });

//    return Red;
//});

