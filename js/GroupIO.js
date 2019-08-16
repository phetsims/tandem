// Copyright 2019, University of Colorado Boulder

/**
 * IO type for Group. TODO: this was copy/pasted from ObservableArrayIO.  It should either subclass it or be rewritten.
 * TODO: or better decoupled.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Andrew Adare (PhET Interactive Simulations)
 */
define( require => {
  'use strict';

  // modules
  const FunctionIO = require( 'TANDEM/types/FunctionIO' );
  const getParametricTypeIO = require( 'TANDEM/types/getParametricTypeIO' );
  const NumberIO = require( 'TANDEM/types/NumberIO' );
  const phetioInherit = require( 'TANDEM/phetioInherit' );
  const VoidIO = require( 'TANDEM/types/VoidIO' );
  const tandemNamespace = require( 'TANDEM/tandemNamespace' );

  // constants
  const OBSERVABLE_ARRAY_VALIDATOR = {
    isValidValue: v => {
      const Group = window.phet ? phet.tandem.Group : tandemNamespace.Group;
      return v instanceof Group;
    }
  };

  /**
   * Parametric IO type constructor.  Given an element type, this function returns an ObservableArray IO type.
   * @param {function(new:ObjectIO)} parameterType - IO type of the DerivedProperty. If loaded by phet (not phet-io)
   *                                    it will be the function returned by the 'ifphetio!' plugin.
   * @param {Object} options
   * @returns {function(new:ObjectIO)}
   * @constructor
   */
  function GroupIO( parameterType, options ) {

    options = _.extend( {
      isReferenceType: true
    }, options );

    const ParametricTypeIO = getParametricTypeIO( GroupIO, 'GroupIO', [ parameterType ] );

    /**
     * This type constructor is parameterized based on the parameterType
     * @param {ObservableArray} observableArray
     * @param {string} phetioID
     * @constructor
     */
    const ObservableArrayIOImpl = function ObservableArrayIOImpl( observableArray, phetioID ) {
      assert && assert( typeof ( parameterType ) === 'function', 'element type should be defined' );
      ParametricTypeIO.call( this, observableArray, phetioID );
    };

    return phetioInherit( ParametricTypeIO, ParametricTypeIO.subtypeTypeName, ObservableArrayIOImpl, {

      /**
       * Adds a listener to the observable array.
       * @param listener
       * @public
       */
      addItemAddedListener: {
        returnType: VoidIO,
        parameterTypes: [ FunctionIO( VoidIO, [ parameterType ] ) ],
        implementation: function( listener ) {
          this.phetioObject.addItemAddedListener( listener );
        },
        documentation: 'Add a listener that is called when an item is added to the observable array.'
      },

      /**
       * Removes a listener that was added via addItemAddedListener.
       * @param listener
       * @public
       */
      addItemRemovedListener: {
        returnType: VoidIO,
        parameterTypes: [ FunctionIO( VoidIO, [ parameterType ] ) ],
        implementation: function( listener ) {
          this.phetioObject.addItemRemovedListener( listener );
        },
        documentation: 'Add a listener that is called when an item is removed from the observable array.'
      },

      /**
       * Get the number of electrons currently in the array.
       */
      getLength: {
        returnType: NumberIO,
        parameterTypes: [],
        implementation: function() {
          return this.phetioObject.length;
        },
        documentation: 'Get the number of elements in the observable array'
      }
    }, {

      /**
       * Adds a Track as specified by the phetioID and state.
       * A Track will create its own ControlPoints
       * @param {Group} group
       * @param {string} componentName
       * @param {Object} stateObject
       */
      // TODO https://github.com/phetsims/phet-io/issues/1454 I chose a different method name to remain backward
      // TODO: compatible with legacy group patterns
      // TODO https://github.com/phetsims/phet-io/issues/1454 move this to GroupIO
      addChildInstanceFromComponentName: function( group, componentName, stateObject ) {
        const prototypeName = stateObject.prototypeName;
        delete stateObject.prototypeName;
        group.createGroupMember( componentName, prototypeName || 'prototype', stateObject );
      },

      clearChildInstances: function( group ) {
        group.clearGroup();
      },

      documentation: 'An array that sends notifications when its values have changed.',
      validator: OBSERVABLE_ARRAY_VALIDATOR,
      events: [ 'itemAdded', 'itemRemoved' ]
    } );
  }

  tandemNamespace.register( 'GroupIO', GroupIO );

  return GroupIO;
} );

