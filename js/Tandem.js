// Copyright 2002-2014, University of Colorado Boulder

/**
 * Tandem is a general instance registry that can be used to track creation/disposal of instances in
 * PhET Simulations.  It is used for together.js instrumentation.
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
    
    if (arguments.length===0){
      id= '';
    }
    // @private
    this.id = id;
  }

  var instanceListeners = [];

  // Export so preloads such as together can use it.
  window.Tandem = Tandem;

  inherit( Object, Tandem, {
    addInstance: function( instance ) {
      for ( var i = 0; i < instanceListeners.length; i++ ) {
        instanceListeners[ i ].addInstance( this.id, instance );
      }
    },
    removeInstance: function( instance ) {
      for ( var i = 0; i < instanceListeners.length; i++ ) {
        instanceListeners[ i ].removeInstance( this.id, instance );
      }
    },

    /**
     * Create a new Tandem by appending the given id
     * @param {string} id
     * @returns {Tandem}
     */
    createTandem: function( id ) {
      if ( this.id.length > 0 ) {
        return new Tandem( this.id + '.' + id );
      }
      else {
        return new Tandem( id );
      }
    }
  }, {
    addInstanceListener: function( instanceListener ) {
      instanceListeners.push( instanceListener );
    }
  } );

  // Check for listeners in the preload.  This is necessary so that together.js can 
  // receive notifications about items created during static initialization such as Solute.js
  // which is created before Sim.js runs.
  if ( window.tandemPreloadInstanceListeners ) {
    for ( var i = 0; i < window.tandemPreloadInstanceListeners.length; i++ ) {
      Tandem.addInstanceListener( window.tandemPreloadInstanceListeners[ i ] );
    }
  }

  return Tandem;
} );