NESTED EMBER APPLICATIONS
=========================

In order to integrate multiple Ember Applications together seamlessly it
would be nice that those are freely nestable and cross-routable.

This project is a proof of concept of such nesting implementation
where there are two apps `red` and `green` accessible independently
inside its own .html file (Slice) and an integration application
`blue` which is instantiating the individual apps inside its
route views.

The two Components are clean Ember.Application subclasses which are only
mixed in with a Em.Nesting.NestedApplicationMixin and otherwise do not differ
from a default way of Ember.Application structure/rules.

The Integration App then uses a Em.Nesting.IntegrationAppMixin which ensures
it is capable of instantiating the Component Ember.Application subclasses
on-demand.

Status
======

POC only.
Cross-Component routing TBD (only some hints are included).

Ember Adjustments
=================

A list of changes that were performed to several Ember components in order to
support nesting follows.

The necessary mixins are implemented in the apps/integration.js file.

Resolver
--------
Adjusted to also look up on the Ember.Application subclass when not found via
Em.get(Namespace, key). This is required due to the lazy Component
instantiation functionality.

ApplicationView
---------------
Its #appendTo method asserts by default when attempted to nest under another
app's rootElement. In our use-case it is overriden to simply do the same and
not to assert.

EventDispatcher
---------------
It was necessary to disable the #setup method to avoid duplicating the jquery
delegate setup stuff.

Handlebars
----------
Sugar added to support Ember.Application instance bound helper registrations.


Glossary
========

Component
---------

Ember application implementing component as designed.

Integration App
---------------

Ember application capable of combining multiple Components. It provides common
abstractions and services to allow the Components to function as a part of a Slice.

Slice
-----

An .html single page application containing one or more Components wrapped under
an Integration App

Integration Frame
-----------------

Basically an Integration App that contains the necessary top-level navigation to
orchestrate Components.


Component Guidelines
====================

Power package
-------------

Each component application must generate a bower package. This ensures
per-component semver versioning capabilities.


Own Isolated Namespace
----------------------

Each Component provides its own namespace in a form of an Em.Application subclass. This is necessary to be able to load the application code into a single slice (javascript loaded into a single .html document). Like var Designer = Em.Application.extend(), var Dashboard = Em.Application.extend();
note: There is no need to define global/window variable for the Component App. As our current JS module approach implies the namespaces to be global care must be taken for those not to conflict. The namespaces can be self-contained and are provided via normal Component js module export (a module closure return value for AMD module system). E.g. for {{view}} helper see the ember-cli docs example.
Also note that these are not Em.Application instances but rather subclasses. This is essential for creating/tearing down the app instances embedded in an IntegrationApp.

Stying
------

A common IntegrationApp theme is to be kept as the styling foundation. The slice integration app loads the styles which are re-used in the individual component applications.
To avoid development effort a default integration frame application/environment is to be used even during individual application development (no styling/integration surprises).

App register handlebars helpers
-------------------------------

Ember Handlebars helpers are generally put into a global Em.Handlebars.helpers container. This could create conflicts when merging multiple ComponentApp codebases into a single Slice. The helpers could however be put into the application container under the 'helper' type.

For example instead of Em.Handlebars.registerBoundHelper('name', fn) use application container helper registration app.register('helper:name-with-dashes', fn).

note: name must contain a dash in order to get looked up in the application container. Therefore some prefix use is recommended.
A mixin putting the register(Bound)Helper to an Em.Application instance was created to make this more straightforward.

Handlebars Templates
--------------------

Normally Ember expects the handlebars templates being put into a global Ember.TEMPLATES. This global reference can be customized in a resolver and the recommendation would be to put it into the Component namespace. i.e. Dashboard.TEMPLATES where Dashboard = Em.Application.extend().

Ember di provided libraries
---------------------------

Any part of a Component-specific technology that could clash with another Component must be resolved through the Em.Container in order to be able to coexist. This approach is sufficient as DI injections are container specific provided the libraries do not clash in browser window/global space.
E.g. Because of legacy reasons a Component could utilize its own store implementation (data abstraction) is going to be probably different from implementations used elsewhere.



Install
=======

```
npm install
./node_modules/.bin/http-server .
```

Results
=======

Component applications
----------------------
```
open http://localhost:8080/apps/red
open http://localhost:8080/apps/green
```

Container application
---------------------
```
open http://localhost:8080/apps/blue
```
