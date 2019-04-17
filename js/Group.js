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
  const GroupIO = require( 'TANDEM/types/GroupIO' );
  const GroupMemberTandem = require( 'TANDEM/GroupMemberTandem' );
  const ObservableArray = require( 'AXON/ObservableArray' );
  const tandemNamespace = require( 'TANDEM/tandemNamespace' );

  // constants
  const GROUP_SEPARATOR_TOKEN = phetio.PhetioIDUtils.GROUP_SEPARATOR_TOKEN;

  class Group extends ObservableArray {

    /**
     * @param {string} prefix
     * @param {Object} prototypeSchema
     * @param {Object} [options] - describe the Group itself
     */
    constructor( prefix, prototypeSchema, options ) {

      options = _.extend( {
        phetioType: GroupIO,
        phetioState: false
      }, options );

      super( options );

      // @private - for generating indices from a pool
      this.groupElementIndex = 0;

      // @private
      this.prefix = prefix || 'element';
      this.prototypeSchema = prototypeSchema;
      this.prototypesTandem = this.tandem.createTandem( 'prototypes' );
      this.prototypeNames = Object.keys( prototypeSchema );
      this.groupOptions = options;

      for ( let i = 0; i < this.prototypeNames.length; i++ ) {
        const prototypeName = this.prototypeNames[ i ];

        // create with any default state and nested substructure
        this.prototypeSchema[ prototypeName ]( this.prototypesTandem.createTandem( prototypeName ) );
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
        this.prefix + GROUP_SEPARATOR_TOKEN + ( this.groupElementIndex++ ),
        prototypeName,
        this.tandem.getExtendedOptions( options )
      );
    }

    isGroupMemberID( componentName ) {
      return componentName.indexOf( this.prefix + GROUP_SEPARATOR_TOKEN ) === 0;
    }

    clearGroup() {

      // TODO: add a method that clears one at a time
      this.forEach( groupMember => groupMember.dispose() );
      this.clear();
    }

    createNextGroupMember( prototypeName ) {
      return this.createGroupMember( this.prefix + GROUP_SEPARATOR_TOKEN + ( this.groupElementIndex++ ), prototypeName );
    }

    createGroupMember( componentName, prototypeName ) {

      // TODO: how to get prototype name from setState? Will we need to save the prototypeName in the state?
      if ( prototypeName === undefined ) {
        prototypeName = Object.keys( this.prototypeSchema )[ 0 ];
      }

      // create with default state and substructure, details will need to be set by setter methods.
      const groupMember = this.prototypeSchema[ prototypeName ]( new GroupMemberTandem(
        this.tandem,
        componentName,
        prototypeName,
        this.tandem.getExtendedOptions( this.groupOptions )
      ) );

      this.push( groupMember );

      return groupMember;
    }
  }

  return tandemNamespace.register( 'Group', Group );
} );