// Copyright 2016, University of Colorado Boulder

/**
 * Subtype decorator for SCENERY/nodes/Path that supplies (optional) Tandem registration.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */
define( function( require ) {
  'use strict';

  // modules
  var inherit = require( 'PHET_CORE/inherit' );
  var Path = require( 'SCENERY/nodes/Path' );
  var tandemNamespace = require( 'TANDEM/tandemNamespace' );
  var Tandem = require( 'TANDEM/Tandem' );

  // phet-io modules
  var TNode = require( 'ifphetio!PHET_IO/types/scenery/nodes/TNode' );

  /**
   * @param {string} shape
   * @param {Object} [options]
   * @constructor
   */
  function TandemPath( shape, options ) {
    Tandem.validateOptions( options ); // The tandem is required when brand==='phet-io'
    Path.call( this, shape, options );

    TNode && options.tandem && options.tandem.addInstance( this, TNode );

    // @private
    this.disposeTandemPath = function() {
      options.tandem && options.tandem.removeInstance( this );
    };
  }

  tandemNamespace.register( 'TandemPath', TandemPath );

  return inherit( Path, TandemPath, {

    // @public
    dispose: function() {
      assert && assert( typeof Path.prototype.dispose === 'undefined',
        'Supertype shouldn\'t have its own dispose method, or we may have accidentally overriden it' );
      this.disposeTandemPath();
    }
  } );
} );