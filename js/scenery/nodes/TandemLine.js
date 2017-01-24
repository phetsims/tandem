// Copyright 2016, University of Colorado Boulder

/**
 * Subtype decorator for SCENERY/nodes/Line that supplies (optional) Tandem registration.
 *
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */
define( function( require ) {
  'use strict';

  // modules
  var inherit = require( 'PHET_CORE/inherit' );
  var Line = require( 'SCENERY/nodes/Line' );
  var tandemNamespace = require( 'TANDEM/tandemNamespace' );
  var Tandem = require( 'TANDEM/Tandem' );

  // phet-io modules
  var TNode = require( 'ifphetio!PHET_IO/types/scenery/nodes/TNode' );

  /**
   * @param {number} x1
   * @param {number} y1
   * @param {number} x2
   * @param {number} y2
   * @param {Object} [options]
   * @constructor
   */
  function TandemLine( x1, y1, x2, y2, options ) {

    options = _.extend( { tandem: Tandem.tandemRequired() }, options );
    Line.apply( this, arguments );

    options.tandem && options.tandem.addInstance( this, TNode ); // TODO: Create TLine

    // @private
    this.disposeTandemLine = function() {
      options.tandem && options.tandem.removeInstance( this );
    };
  }

  tandemNamespace.register( 'TandemLine', TandemLine );

  return inherit( Line, TandemLine, {

    // @public
    dispose: function() {
      Line.prototype.dispose.call( this );
      this.disposeTandemLine();
    }
  } );
} );