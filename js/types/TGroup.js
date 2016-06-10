// Copyright 2016, University of Colorado Boulder

/**
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Andrew Adare
 */
define( function( require ) {
  'use strict';

  // modules
  var phetioNamespace = require( 'PHET_IO/phetioNamespace' );

  // constants
  var phetioInherit = require( 'PHET_IO/phetioInherit' );
  var TObject = require( 'PHET_IO/api/TObject' );

  /**
   * For elements that may have many of the same type, such as in an array
   * or observable array, named like:
   * sim.screen.model.electron_0
   * @param elementType
   * @constructor
   */
  var TGroup = function( elementType ) {
    return phetioInherit( TObject, 'TGroup(' + elementType.typeName + ')', function( arrayInstance, phetioID ) {
      TObject.call( this, arrayInstance, phetioID );

      // TODO: type check somehow?
    }, {}, {
      documentation: 'For elements that may have many of the same type, such as in a TArray or TObservableArray',
      elementType: elementType
    } );
  };

  phetioNamespace.register( 'TGroup', TGroup );

  return TGroup;
} );
