// Copyright 2016, University of Colorado Boulder

/**
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Andrew Adare (PhET Interactive Simulations)
 */
define( function( require ) {
  'use strict';

  // modules
  var assertInstanceOf = require( 'ifphetio!PHET_IO/assertInstanceOf' );
  var phetioInherit = require( 'ifphetio!PHET_IO/phetioInherit' );
  var tandemNamespace = require( 'TANDEM/tandemNamespace' );
  var ObjectIO = require( 'ifphetio!PHET_IO/types/ObjectIO' );
  var StringIO = require( 'ifphetio!PHET_IO/types/StringIO' );

  /**
   * Wrapper type for phet/tandem's Tandem class.
   * @param arrayInstance
   * @param phetioID
   * @constructor
   */
  function TTandem( arrayInstance, phetioID ) {
    assert && assertInstanceOf( arrayInstance, phet.tandem.Tandem );
    ObjectIO.call( this, arrayInstance, phetioID );
  }

  phetioInherit( ObjectIO, 'TTandem', TTandem, {}, {
    documentation: 'Tandems give sim elements their phet-io identifiers',

    /**
     * Decodes a state into a Tandem.
     * @param {Tandem} instance
     * @returns {Object}
     */
    toStateObject: function( instance ) {
      return StringIO.toStateObject( instance.id );
    },

    /**
     * Encodes a Tandem instance to a state.
     * @param stateObject
     * @returns {Tandem}
     */
    fromStateObject: function( stateObject ) {
      return new phet.tandem.Tandem( StringIO.fromStateObject( stateObject ) );
    }
  } );

  tandemNamespace.register( 'TTandem', TTandem );

  return TTandem;
} );

