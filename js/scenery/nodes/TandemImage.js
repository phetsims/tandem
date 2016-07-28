// Copyright 2016, University of Colorado Boulder

/**
 * Subtype decorator for SCENERY/nodes/Image that supplies (optional) Tandem registration.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */
define( function( require ) {
  'use strict';

  // modules
  var inherit = require( 'PHET_CORE/inherit' );
  var Image = require( 'SCENERY/nodes/Image' );
  var tandemNamespace = require( 'TANDEM/tandemNamespace' );
  var Tandem = require( 'TANDEM/Tandem' );

  // phet-io modules
  var TNode = require( 'ifphetio!PHET_IO/types/scenery/nodes/TNode' ); // TODO: image type

  /**
   * @param {string} image
   * @param {Object} [options]
   * @constructor
   */
  function TandemImage( image, options ) {
    Tandem.validateOptions( options ); // The tandem is required when brand==='phet-io'
    Image.call( this, image, options );

    options.tandem && options.tandem.addInstance( this, TNode );

    // @private
    this.disposeTandemImage = function() {
      options.tandem && options.tandem.removeInstance( this );
    };
  }

  tandemNamespace.register( 'TandemImage', TandemImage );

  return inherit( Image, TandemImage, {

    // @public
    dispose: function() {
      assert && assert( typeof Image.prototype.dispose === 'undefined',
        'Supertype shouldn\'t have its own dispose method, or we may have accidentally overriden it' );
      this.disposeTandemImage();
    }
  } );
} );