// Copyright 2016, University of Colorado Boulder

/**
 * Subtype decorator for SCENERY/nodes/Circle that supplies (optional) Tandem registration.
 *
 * @author John Blanco (PhET Interactive Simulations)
 */
define( function( require ) {
  'use strict';

  // modules
  var inherit = require( 'PHET_CORE/inherit' );
  var Circle = require( 'SCENERY/nodes/Circle' );
  var tandemNamespace = require( 'TANDEM/tandemNamespace' );
  var Tandem = require( 'TANDEM/Tandem' );

  // phet-io modules
  var TNode = require( 'ifphetio!PHET_IO/types/scenery/nodes/TNode' );

  /**
   * @param {number} radius
   * @param {Object} [options]
   * @constructor
   */
  function TandemCircle( radius, options ) {

    options = _.extend( {
      tandem: Tandem.tandemRequired()
    }, options );

    // Handle new Circle( { radius: ... } )
    if ( typeof radius === 'object' ) {
      options = radius;
    }

    Circle.apply( this, arguments );

    options.tandem && options.tandem.addInstance( this, TNode ); // TODO: Create TCircle

    // @private
    this.disposeTandemCircle = function() {
      options.tandem && options.tandem.removeInstance( this );
    };
  }

  tandemNamespace.register( 'TandemCircle', TandemCircle );

  return inherit( Circle, TandemCircle, {

    // @public
    dispose: function() {
      Circle.prototype.dispose.call( this );
      this.disposeTandemCircle();
    }
  } );
} );