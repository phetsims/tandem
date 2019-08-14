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
  const PhetioObject = require( 'TANDEM/PhetioObject' );
  const StringUtils = require( 'PHETCOMMON/util/StringUtils' );
  const Tandem = require( 'TANDEM/Tandem' );
  const tandemNamespace = require( 'TANDEM/tandemNamespace' );

  // constants
  const GROUP_SEPARATOR = phetio.PhetioIDUtils.GROUP_SEPARATOR;
  const HOMOGENEOUS_KEY_NAME = 'prototype';

  class Group extends ObservableArray {

    /**
     * @param {string} prefix - like "particle" or "person" or "electron", and will be suffixed like "particle_0"
     * @param {Object.<string,function>} prototypeSchema - a map of prototype name to function that returns the
     *                                                   - prototype for that type.
     *                                                   - For homogeneous groups, the map has only one key
     *                                                   - For heterogeneous groups, the map has one key per element type
     * @param {Object} [options] - describe the Group itself
     */
    constructor( prefix, prototypeSchema, options ) {

      assert && assert( typeof prototypeSchema === 'object', 'prototypeSchema should be an object' );

      const prototypeSchemaKeys = Object.keys( prototypeSchema );

      if ( prototypeSchemaKeys.length === 1 ) {
        assert && assert( prototypeSchemaKeys[ 0 ] === HOMOGENEOUS_KEY_NAME, 'Homogeneous groups should have entry named prototype' );
      }

      options = _.extend( {
        phetioType: GroupIO,
        phetioState: false
      }, options );

      super( options );

      // @private - for generating indices from a pool
      this.groupElementIndex = 0;

      // @private
      this.prefix = prefix;

      // @private {Object.<string,function>}
      this.prototypeSchema = prototypeSchema;

      // @private {string[]}
      this.prototypeSchemaKeys = prototypeSchemaKeys;

      this.groupOptions = options;

      // When generating the baseline, output the schema for the prototype(s)
      if ( phet.phetio && phet.phetio.queryParameters.phetioPrintPhetioFiles ) {
        prototypeSchemaKeys.forEach( key => {
          const prototype = this.prototypeSchema[ key ]( this.tandem.createTandem( this.keyToPrototypeName( key ) ) );
          assert && Group.assertDynamicPhetioObject( prototype );
        } );
      }

      // There cannot be any items in the Group yet, and here we check for subsequently added items.
      assert && Tandem.PHET_IO_ENABLED && this.addItemAddedListener( Group.assertDynamicPhetioObject );
    }

    /**
     * Create the corresponding tandem name for a specific key.  For instance:
     *
     * Heterogenous Group:
     * electron => prototypeElectron
     * neutron => prototypeNeutron
     *
     * Homogeneous Group:
     * prototype => prototype
     *
     * @param {string} key
     * @returns {string}
     * @private
     */
    keyToPrototypeName( key ) {
      return this.prototypeSchemaKeys.length === 1 ?
             HOMOGENEOUS_KEY_NAME :
             HOMOGENEOUS_KEY_NAME + StringUtils.capitalize( key );
    }

    isGroupMemberID( componentName ) {
      return componentName.indexOf( this.prefix + GROUP_SEPARATOR ) === 0;
    }

    clearGroup() {

      // TODO: add a method that clears one at a time
      this.forEach( groupMember => groupMember.dispose() );
      this.clear();
    }

    /**
     * Creates the next group member.
     * @param {string} [prototypeName] - necessary for heterogeneous groups
     * @returns {PhetioObject}
     * @public
     */
    createNextGroupMember( prototypeName = HOMOGENEOUS_KEY_NAME ) {
      assert && assert( this.prototypeSchema.hasOwnProperty( prototypeName ), 'prototypeSchema doesnt contain ' + prototypeName );
      return this.createGroupMember( this.prefix + GROUP_SEPARATOR + ( this.groupElementIndex++ ), prototypeName );
    }

    /**
     * @param {string} componentName - the name of the individual member
     * @param {string} prototypeName
     * @returns {Object}
     * @private
     */
    createGroupMember( componentName, prototypeName ) {

      // create with default state and substructure, details will need to be set by setter methods.
      const createMember = this.prototypeSchema[ prototypeName ];
      const groupMember = createMember( new GroupMemberTandem(
        this.tandem,
        componentName,
        this.keyToPrototypeName( prototypeName ),
        this.tandem.getExtendedOptions( this.groupOptions )
      ) );

      this.push( groupMember );

      return groupMember;
    }

    /**
     * A dynamic element should be an instrumented PhetioObject with phetioDynamicElement: true
     * @param {PhetioObject} phetioObject - object to be validated
     * @public
     * @static
     */
    static assertDynamicPhetioObject( phetioObject ) {
      assert && assert( phetioObject instanceof PhetioObject, 'instance should be a PhetioObject' );
      assert && assert( phetioObject.isPhetioInstrumented(), 'instance should be instrumented' );
      assert && assert( phetioObject.phetioDynamicElement, 'instance should be marked as phetioDynamicElement:true' );
    }
  }

  return tandemNamespace.register( 'Group', Group );
} );