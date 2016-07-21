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
  var TTandemText = require( 'PHET_IO/types/tandem/scenery/nodes/TTandemText' );

  /**
   * @param {string} text
   * @param {Object} [options]
   * @constructor
   */
  function TandemText( text, options ) {
    Tandem.validateOptions( options ); // The tandem is required when brand==='phet-io'
    Text.call( this, text, options );

    TTandemText && options.tandem && options.tandem.addInstance( this, TTandemText );

    // @private
    this.disposeTandemText = function() {
      options.tandem && options.tandem.removeInstance( this );
    };
  }

  tandemNamespace.register( 'TandemText', TandemText );

  return inherit( Text, TandemText, {

    // @public
    dispose: function() {
      assert && assert( typeof Text.prototype.dispose === 'undefined',
        'Supertype shouldn\'t have its own dispose method, or we may have accidentally overriden it' );
      this.disposeTandemText();
    }
  } );
} );