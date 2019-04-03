// Copyright 2019, University of Colorado Boulder

/**
 * A tandem that stores the name of the prototype that defines its schema
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Chris Klusendorf (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */
define( require => {
  'use strict';

  // modules
  const Tandem = require( 'TANDEM/Tandem' );
  var tandemNamespace = require( 'TANDEM/tandemNamespace' );

  class GroupMemberTandem extends Tandem {

    /**
     * @param {Tandem} id - id as a string (or '' for a root id)
     * @param {string} prototypeName
     * @param {Object} [options]
     */
    constructor( id, prototypeName, options ) {

      super( id, options );

      // @private
      this.prototypeName = prototypeName;
    }
  }

  return tandemNamespace.register( 'GroupMemberTandem', GroupMemberTandem );
} );