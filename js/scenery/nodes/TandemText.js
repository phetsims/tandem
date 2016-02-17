// Copyright 2016, University of Colorado Boulder

/**
 * Subtype decorator for SCENERY/nodes/Text that supplies (mandatory) Tandem registration.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */
define( function( require ) {
  'use strict';

  // modules
  var inherit = require( 'PHET_CORE/inherit' );
  var Text = require( 'SCENERY/nodes/Text' );
  var tandemNamespace = require( 'TANDEM/tandemNamespace' );

  /**
   * @param {string} text
   * @param {Object} [options]
   * @constructor
   */
  function TandemText( text, options ) {

    assert && assert( options && options.tandem, 'TandemText must have a tandem' );
    Text.call( this, text, options );

    options.tandem.addInstance( this );

    // @private
    this.disposeTandemText = function() {
      options.tandem.removeInstance( this );
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