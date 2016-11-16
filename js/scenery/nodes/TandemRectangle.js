// Copyright 2016, University of Colorado Boulder

/**
 * Subtype decorator for SCENERY/nodes/Rectangle that supplies (optional) Tandem registration.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */
define( function( require ) {
  'use strict';

  // modules
  var inherit = require( 'PHET_CORE/inherit' );
  var Rectangle = require( 'SCENERY/nodes/Rectangle' );
  var tandemNamespace = require( 'TANDEM/tandemNamespace' );
  var Tandem = require( 'TANDEM/Tandem' );

  // phet-io modules
  var TNode = require( 'ifphetio!PHET_IO/types/scenery/nodes/TNode' );

  /**
   * @param {number} x
   * @param {number} y
   * @param {number} width
   * @param {number} height
   * @param {number} cornerXRadius
   * @param {number} cornerYRadius
   * @param {Object} [options]
   * @constructor
   */
  function TandemRectangle( x, y, width, height, cornerXRadius, cornerYRadius, options ) {
    Tandem.validateOptions( options ); // The tandem is required when brand==='phet-io'
    Rectangle.call( this, x, y, width, height, cornerXRadius, cornerYRadius, options );

    options.tandem && options.tandem.addInstance( this, TNode ); // TODO: Create TRectangle

    // @private
    this.disposeTandemRectangle = function() {
      options.tandem && options.tandem.removeInstance( this );
    };
  }

  tandemNamespace.register( 'TandemRectangle', TandemRectangle );

  return inherit( Rectangle, TandemRectangle, {

    // @public
    dispose: function() {
      Rectangle.prototype.dispose.call( this );
      this.disposeTandemRectangle();
    }
  } );
} );