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
  var Node = require( 'SCENERY/nodes/Node' );
  var tandemNamespace = require( 'TANDEM/tandemNamespace' );
  var Tandem = require( 'TANDEM/Tandem' );

  // phet-io modules
  // TODO: Rename to TNode????
  var TNode = require( 'ifphetio!PHET_IO/types/scenery/nodes/TNode' );

  /**
   * @param {string} text
   * @param {Object} [options]
   * @constructor
   */
  function TandemNode( options ) {
    Tandem.validateOptions( options ); // The tandem is required when brand==='phet-io'
    Node.call( this, options );

    TNode && options.tandem && options.tandem.addInstance( this, TNode );

    // @private
    this.disposeTandemNode = function() {
      options.tandem && options.tandem.removeInstance( this );
    };
  }

  tandemNamespace.register( 'TandemNode', TandemNode );

  return inherit( Node, TandemNode, {

    // @public
    dispose: function() {
      assert && assert( typeof Text.prototype.dispose === 'undefined',
        'Supertype shouldn\'t have its own dispose method, or we may have accidentally overriden it' );
      this.disposeTandemNode();
    }
  } );
} );