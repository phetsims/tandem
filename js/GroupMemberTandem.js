// Copyright 2019, University of Colorado Boulder

/**
 * A tandem that stores the name of the prototype that defines its schema
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Chris Klusendorf (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */
define( require => {
  'use strict';

  // modules
  const Tandem = require( 'TANDEM/Tandem' );
  const tandemNamespace = require( 'TANDEM/tandemNamespace' );

  class GroupMemberTandem extends Tandem {

    /**
     * @param {Tandem} parentTandem
     * @param {string} name
     * @param {string} prototypeName - describes which prototype this matches
     * @param {Object} [options]
     */
    constructor( parentTandem, name, prototypeName, options ) {
      assert && assert( parentTandem, 'GroupMemberTandem must have a parentTandem' );
      super( parentTandem, name, options );

      // @private (read-only)
      this.prototypeName = prototypeName;
    }

    /**
     * Returns the regular expression which can be used to test each term.
     * @returns {RegExp}
     * @protected
     */
    getTermRegex() {
      return /^[a-zA-Z0-9_]+$/;
    }

    /**
     * Tacks on this Tandem's suffix to the given parentPhetioID, used to look up concrete phetioIDs
     * @param {string} parentPhetioID
     * @returns {string}
     * @protected
     * @override
     */
    appendConcreteSuffix( parentPhetioID ) {
      return phetio.PhetioIDUtils.append( parentPhetioID, 'prototypes', this.prototypeName );
    }

    /**
     * @override
     * @returns {boolean}
     * @protected
     */
    isGroupMember() {
      return true;
    }
  }

  return tandemNamespace.register( 'GroupMemberTandem', GroupMemberTandem );
} );