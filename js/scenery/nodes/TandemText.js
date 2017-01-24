// Copyright 2016, University of Colorado Boulder

/**
 * Subtype decorator for SCENERY/nodes/Text that supplies (optional) Tandem registration.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */
define( function( require ) {
  'use strict';

  // modules
  var inherit = require( 'PHET_CORE/inherit' );
  var Text = require( 'SCENERY/nodes/Text' );
  var tandemNamespace = require( 'TANDEM/tandemNamespace' );
  var Tandem = require( 'TANDEM/Tandem' );

  // phet-io modules
  var TTandemText = require( 'ifphetio!PHET_IO/types/tandem/scenery/nodes/TTandemText' );

  /**
   * @param {string} text
   * @param {Object} [options]
   * @constructor
   */
  function TandemText( text, options ) {
    options = _.extend( { tandem: Tandem.tandemRequired() }, options );
    Text.call( this, text, options );

    options.tandem && options.tandem.addInstance( this, TTandemText );

    // @private
    this.disposeTandemText = function() {
      options.tandem && options.tandem.removeInstance( this );
    };
  }

  tandemNamespace.register( 'TandemText', TandemText );

  return inherit( Text, TandemText, {

    // @public
    dispose: function() {
      Text.prototype.dispose.call( this );
      this.disposeTandemText();
    }
  } );
} );