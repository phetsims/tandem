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
     * Returns the regular expression which can be used to test each term. The term must consist only of alpha-numeric
     * characters or underscores.
     * @returns {RegExp}
     * @protected
     */
    getTermRegex() {
      return /^[a-zA-Z0-9_]+$/;
    }

    /**
     * See Tandem.getConcretePhetioID, in this case, look up the corresponding prototype.
     * A dynamic phetioID contains text like .................'sim.screen1.particles.particles_7.visibleProperty'
     * which corresponds to the prototype "quark" ....
     * This method looks up the corresponding prototype like..'sim.screen1.particles.prototypes.quark.visibleProperty'
     * @returns {string}
     * @public
     * @override
     */
    getConcretePhetioID() {
      assert && assert( this.parentTandem, 'Group members must be in a Group' );
      return phetio.PhetioIDUtils.append( this.parentTandem.getConcretePhetioID(), 'prototypes', this.prototypeName );
    }
  }

  return tandemNamespace.register( 'GroupMemberTandem', GroupMemberTandem );
} );