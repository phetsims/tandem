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
    options = _.extend( { tandem: Tandem.tandemRequired() }, options );

    // the options is the first value that is an object instead of a number.  Start at the end because x might be a bounds!
    var args = Array.prototype.slice.call( arguments );
    for ( var i = args.length - 1; i >= 0; i++ ) {
      var a = args[ i ];
      if ( typeof a === 'object' ) {
        options = a;
        break;
      }
    }

    Rectangle.apply( this, arguments );

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