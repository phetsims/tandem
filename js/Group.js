// Copyright 2019, University of Colorado Boulder

/**
 * Provides a placeholder in the static API for where dynamic elements may be created.  Checks that members of the group
 * match the approved schema.
 *
 * @author Michael Kauzmann (PhET Interactive Simulations)
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Chris Klusendorf (PhET Interactive Simulations)
 */
define( require => {
  'use strict';

  // modules
  const tandemNamespace = require( 'TANDEM/tandemNamespace' );
  const GroupMemberTandem = require( 'TANDEM/GroupMemberTandem' );
  const PhetioObject = require( 'TANDEM/PhetioObject' );
  const GroupIO = require( 'TANDEM/types/GroupIO' );

  class Group extends PhetioObject {

    /**
     * @param {string} prefix
     * @param {Object} prototypeSchema
     * @param {Object} [options] - describe the Group itself
     */
    constructor( prefix, prototypeSchema, options ) {

      options = _.extend( {
        phetioType: GroupIO
      }, options );

      super( options );

      // @private for generating indices from a pool
      this.groupElementIndex = 0;

      // @private
      this.prefix = prefix || 'element';

      const prototypesTandem = this.tandem.createTandem( 'prototypes' );
      this.prototypeNames = Object.keys( prototypeSchema );

      for ( let i = 0; i < this.prototypeNames.length; i++ ) {
        const prototypeName = this.prototypeNames[ i ];
        prototypeSchema[ prototypeName ]( prototypesTandem.createTandem( prototypeName ) );
      }
    }

    /**
     * Creates the next tandem in the group.
     * @param {string} prototypeName - for creating Tandems for Groups. This string creates an association between
     *                                    and instance and a group prototype, see GroupMemberTandem.
     * @param {Object} [options]
     * @returns {GroupMemberTandem}
     * @public
     */
    createNextTandem( prototypeName, options ) {
      assert && assert( this.prototypeNames.indexOf( prototypeName ) >= 0, `unexpected prototypeName: ${prototypeName}` );
      return new GroupMemberTandem(
        this.tandem,
        this.prefix + '_' + ( this.groupElementIndex++ ),
        prototypeName,
        this.tandem.getExtendedOptions( options )
      );
    }
  }

  return tandemNamespace.register( 'Group', Group );
} );