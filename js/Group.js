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
  const GroupMemberTandem = require( 'TANDEM/GroupMemberTandem' );
  const ObservableArray = require( 'AXON/ObservableArray' );
  const phetioAPIValidation = require( 'TANDEM/phetioAPIValidation' );
  const PhetioObject = require( 'TANDEM/PhetioObject' );
  const StringUtils = require( 'PHETCOMMON/util/StringUtils' );
  const Tandem = require( 'TANDEM/Tandem' );
  const tandemNamespace = require( 'TANDEM/tandemNamespace' );
  const validate = require( 'AXON/validate' );

  // constants
  const HOMOGENEOUS_KEY_NAME = 'prototype';

  // TODO: do we really like that this extends ObservableArray?
  class Group extends ObservableArray {

    /**
     * @param {string} prefix - like "particle" or "person" or "electron", and will be suffixed like "particle_0"
     * @param {Object.<string,{create:function, [defaultArguments:*[]|function():*[]]}>} prototypeSchema - a map of
     *   prototype name to function that returns the prototype for that type. For homogeneous groups, the map has
     *   only one key For heterogeneous groups, the map has one key per element type.
     *   // TODO: document the api for prototypes, including the create method
     * @param {Object} [options] - describe the Group itself
     */
    constructor( prefix, prototypeSchema, options ) {

      assert && assert( typeof prototypeSchema === 'object', 'prototypeSchema should be an object' );

      const prototypeSchemaKeys = Object.keys( prototypeSchema );

      if ( prototypeSchemaKeys.length === 1 ) {
        assert && assert( prototypeSchemaKeys[ 0 ] === HOMOGENEOUS_KEY_NAME, 'Homogeneous groups should have entry named prototype' );
      }

      options = _.extend( {
        phetioState: false
      }, options );

      assert && assert( !!options.phetioType, 'phetioType must be supplied' );

      super( options );

      // @public (only for GroupIO) - for generating indices from a pool
      // TODO: This should be reset
      this.groupElementIndex = 0;

      // @private
      this.prefix = prefix;

      // @public {Object} - see constructor parameters for details
      this.prototypeSchema = prototypeSchema;

      // @private {string[]}
      this.prototypeSchemaKeys = prototypeSchemaKeys;

      this.groupOptions = options;

      // @public (read-only) {Object.<string, groupMember:Object>} - keep track of prototypes created conditionally, see below.
      this.prototypes = {};

      // When generating the baseline, output the schema for the prototype(s)
      // TODO: (Maybe this, let's discuss more) instead of using phetioAPIValidation.enabled check here, in
      // TODO: phetioAPIValidation use the baseline.phetioTypeName for a whitelist of types that are only
      // TODO: instantiated dynamically.
      // TODO: Also look over in PhetioObject for the same pattern.
      if ( ( phet.phetio && phet.phetio.queryParameters.phetioPrintPhetioFiles ) || phetioAPIValidation.enabled ) {
        prototypeSchemaKeys.forEach( prototypeName => {
          const schema = this.prototypeSchema[ prototypeName ];

          const defaultArguments = schema.defaultArguments || [];

          // TODO: support array or function but not both? samreid what do you think?
          const argsForCreateFunction = Array.isArray( defaultArguments ) ? defaultArguments :
                                        defaultArguments();
          const prototype = schema.create(
            this.tandem.createTandem( this.keyToPrototypeName( prototypeName ) ), prototypeName, ...argsForCreateFunction );

          // {boolean} - hack alert! when printing the baseline, we need to keep track of prototype elements so they
          // appear in the baseline
          prototype.isGroupMemberPrototype = true;
          assert && Group.assertDynamicPhetioObject( prototype );

          this.prototypes[ prototypeName ] = prototype;
        } );
      }

      // There cannot be any items in the Group yet, and here we check for subsequently added items.
      assert && Tandem.PHET_IO_ENABLED && this.addItemAddedListener( Group.assertDynamicPhetioObject );

      // TODO: In the general case, we can't assume that the sim will do the disposal for us, we also can't assume
      // TODO: that all groups want this disposed. Uh oh. Perhaps we could hide this code behind an option. Perhaps this
      // TODO: could go into ObservableArray (via an option)
      // this.addItemRemovedListener( item => item.dispose && item.dispose() )
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

    /**
     * TODO: how do we guarantee that all cleared elements are disposed in the general case.
     * @override
     * @public
     */
    clear() {
      super.clear();

      // TODO: this assumes that clear is disposing (unregistering tandems) for all group members
      this.groupElementIndex = 0;
    }

    /**
     * When creating a view element that corresponds to a specific model element, we match the tandem name index suffix
     * so that electron_0 corresponds to electronNode_0 and so on.
     * @param {PhetioObject} phetioObject
     * @param {...*} argsForCreateFunction - args to be passed to the create function, specified there are in the IO Type `stateObjectToArgs` method
     * @returns {PhetioObject}
     * @public
     */
    createNextCorrespondingGroupMember( phetioObject, ...argsForCreateFunction ) {
      const index = parseInt( phetioObject.tandem.name.split( phetio.PhetioIDUtils.GROUP_SEPARATOR )[ 1 ], 10 );

      // If the specified index overlapped with the next available index, bump it up so there is no collision on the
      // next createNextGroupMember
      if ( this.groupElementIndex === index ) {
        this.groupElementIndex++;
      }
      return this.createGroupMember( HOMOGENEOUS_KEY_NAME, index, argsForCreateFunction );
    }

    /**
     * Only for homogeneous Groups. Creates the next group member.
     * @param {...*} argsForCreateFunction - args to be passed to the create function, specified there are in the IO Type `stateObjectToArgs` method
     * @returns {PhetioObject}
     * @public
     */
    createNextGroupMember( ...argsForCreateFunction ) {
      assert && assert( this.prototypeSchemaKeys.length === 1, 'createNextGroupMember should only be called for homogeneous groups' );
      return this.createGroupMember( HOMOGENEOUS_KEY_NAME, this.groupElementIndex++, argsForCreateFunction );
    }

    /**
     * Creates the next group member for a heterogeneous group.
     * @param {string} prototypeName
     * @param {...*} argsForCreateFunction - args to be passed to the create function, specified there are in the IO Type `stateObjectToArgs` method     * @returns {PhetioObject}
     * @public
     */
    createNextHeterogeneousGroupMember( prototypeName, ...argsForCreateFunction ) {
      assert && assert( this.prototypeSchemaKeys.length > 1, 'createNextHeterogeneousGroupMember should only be called for heterogeneous groups' );
      return this.createGroupMember( prototypeName, this.groupElementIndex++, argsForCreateFunction );
    }

    /**
     * @param {string} prototypeName
     * @param {number} index - the number of the individual member
     * @param {Array.<*>} argsForCreateFunction
     * @returns {Object}
     * @public (GroupIO)
     */
    createGroupMember( prototypeName, index, argsForCreateFunction ) {

      const componentName = this.prefix + phetio.PhetioIDUtils.GROUP_SEPARATOR + index;

      assert && assert( this.prototypeSchema.hasOwnProperty( prototypeName ), 'prototype not found' );

      // create with default state and substructure, details will need to be set by setter methods.
      const prototypeEntry = this.prototypeSchema[ prototypeName ];

      // TODO: discuss the api for the create method
      const groupMember = prototypeEntry.create( new GroupMemberTandem(
        this.tandem,
        componentName,
        this.keyToPrototypeName( prototypeName ),
        this.tandem.getExtendedOptions( this.groupOptions )
      ), prototypeName, ...argsForCreateFunction );

      // Make sure the new group member matches the schema for members.
      validate( groupMember, this.phetioType.parameterType.validator );

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