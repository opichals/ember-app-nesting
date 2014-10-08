// Copyright (C) 2007-2013, GoodData(R) Corporation. All rights reserved.

//require([
//    "../green/green",
//    "../red/red",
//    "../integration"
//], function(Green, Red) {

    var Blue = Em.Application.extend(Em.Nesting.IntegrationAppMixin, {
        name: 'Blue'

        , LOG_TRANSITIONS: true // basic logging of successful transitions
        //, LOG_TRANSITIONS_INTERNAL: true // detailed logging of all routing steps
        ,
        init: function() {
            this._super();

            this.Router.map(this.constructor.RouteMap);
        }
    });
    Blue.RouteMap = function() {
        this.route('green'); // iframe embedded Component
        this.resource('red', Red.RouteMap); // to be inline Component
    };
    Blue = Blue.create();
    Blue.deferReadiness();
    Blue.LOG_RESOLVER = true;

    Blue.ApplicationView = Em.View.extend({
        classNames: ['app-blue'],
        template: Em.Handlebars.compile(
            '<h1>Uber</h1>'+

            '{{#link-to "green"}}green{{/link-to}}<br>'+
            '{{#link-to "red"}}red{{/link-to}}<br>'+
            '<br>'+

            '{{view "green"}}' +
            '<span style="display:inline-block; width:10px;">&nbsp;</span>'+
            '{{view "red"}}' +

            '<span style="display:inline-block; width:50px;">&nbsp;</span>'+
            '{{outlet}}'+
        '')
    });

    Blue.XGreenView = Em.View.extend({
        tagName: 'span',
        template: Em.Handlebars.compile('<iframe src="/apps/green" height="300px" width="200px" allowTransparency="true"></iframe>')
    });
    Blue.GreenView = Em.Nesting.ComponentAppView.extend({
        appName: 'green',
        appClass: Green,

        tagName: 'span'
    });
    Blue.XRedView = Em.View.extend({
        tagName: 'span',
        template: Em.Handlebars.compile('<iframe src="/apps/red" height="300px" width="200px" allowTransparency="true"></iframe>')
    });
    Blue.RedView = Em.Nesting.ComponentAppView.extend({
        appName: 'red',
        appClass: Red,

        tagName: 'span'
    });

//});

