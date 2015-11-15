// Copyright 2015, University of Colorado Boulder

/**
 * Tandem is a general instance registry that can be used to track creation/disposal of instances in PhET Simulations.
 * It is used for together.js instrumentation for PhET-iO support.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */
define( function( require ) {
  'use strict';

  // modules
  var inherit = require( 'PHET_CORE/inherit' );

  /**
   * @param {string} id - id as a string (or '' for a root id)
   * @constructor
   */
  function Tandem( id ) {

    // @public {read-only}
    this.id = (id !== undefined) ? id : '';

    // @private for generating indices from a pool, for array element indices
    this.index = 0;
  }

  // Listeners that will be notified when items are registered/deregistered
  var instanceListeners = [];

  inherit( Object, Tandem, {

    /**
     * Adds an instance of any type.  For example, it could be an axon Property, scenery Node or Sun button.  Each
     * item should only be added to the registry once, but that is not enforced here in Tandem.
     *
     * This is used to register instances with together.
     * @param {Object} instance - the instance to add
     * @public
     */
    addInstance: function( instance ) {
      for ( var i = 0; i < instanceListeners.length; i++ ) {
        instanceListeners[ i ].addInstance( this.id, instance );
      }
    },

    /**
     * Removes an instance from the
     * @param {Object} instance - the instance to remove
     * @public
     */
    removeInstance: function( instance ) {
      for ( var i = 0; i < instanceListeners.length; i++ ) {
        instanceListeners[ i ].removeInstance( this.id, instance );
      }
    },

    /**
     * Create a new Tandem by appending the given id
     * @param {string} id
     * @returns {Tandem}
     * @public
     */
    createTandem: function( id ) {
      var string = (this.id.length > 0) ? (this.id + '.' + id) : id;
      return new Tandem( string );
    },

    createNextIndexTandem: function() {
      assert && assert( this.id.length > 0, 'indexed tandems must have an id' );
      return new Tandem( this.id + '[' + (this.index++) + ']' );
    }
  }, {

    /**
     * Adds a listener that will be notified when items are registered/deregistered
     * Listeners have the form
     * {
     *   addInstance(id,instance),   
     *   removeInstance(id,instance)
     * }
     * where id is of type {string} and instance is of type {Object}
     *
     * @param {Object} instanceListener - described above
     * @public
     * @static
     */
    addInstanceListener: function( instanceListener ) {
      instanceListeners.push( instanceListener );
    }
  } );

  // Tandem checks for listeners added before the Tandem module was loaded.  This is necessary so that together.js can 
  // receive notifications about items created during static initialization such as Solute.js
  // which is created before Sim.js runs.
  if ( window.tandemPreloadInstanceListeners ) {
    for ( var i = 0; i < window.tandemPreloadInstanceListeners.length; i++ ) {
      Tandem.addInstanceListener( window.tandemPreloadInstanceListeners[ i ] );
    }
  }

  return Tandem;
} );