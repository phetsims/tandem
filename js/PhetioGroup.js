// Copyright 2019, University of Colorado Boulder

/**
 * Provides a placeholder in the static API for where dynamic members may be created.  Checks that members of the group
 * match the approved schema.
 *
 * @author Michael Kauzmann (PhET Interactive Simulations)
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Chris Klusendorf (PhET Interactive Simulations)
 */
define( require => {
  'use strict';

  // modules
  const arrayRemove = require( 'PHET_CORE/arrayRemove' );
  const Emitter = require( 'AXON/Emitter' );
  const merge = require( 'PHET_CORE/merge' );
  const PhetioDynamicUtil = require( 'TANDEM/PhetioDynamicUtil' );
  const PhetioObject = require( 'TANDEM/PhetioObject' );
  const Tandem = require( 'TANDEM/Tandem' );
  const tandemNamespace = require( 'TANDEM/tandemNamespace' );

  class PhetioGroup extends PhetioObject {

    /**
     * @param {string} prefix - like "particle" or "person" or "electron", and will be suffixed like "particle_0"
     * @param {function} createMember - function that creates a group member
     * @param {Array.<*>|function.<[],Array.<*>>} defaultArguments arguments passed to create during API harvest
     * @param {Object} [options] - describe the Group itself
     */
    constructor( prefix, createMember, defaultArguments, options ) {

      assert && assert( typeof createMember === 'function', 'createMember should be a function' );
      assert && assert( Array.isArray( defaultArguments ) || typeof defaultArguments === 'function', 'defaultArguments should be an array or a function' );
      if ( Array.isArray( defaultArguments ) ) {
        assert && assert( createMember.length === defaultArguments.length + 1, 'mismatched number of arguments' ); // createMember also takes tandem
      }

      options = merge( {
        phetioState: false, // members are included in state, but the container will exist in the downstream sim.
        tandem: Tandem.required
      }, options );

      assert && assert( !!options.phetioType, 'phetioType must be supplied' );
      assert && assert( !!options.phetioType.parameterTypes, 'PhetioGroupIO must supply its parameter types' );
      assert && assert( options.phetioType.parameterTypes.length === 1, 'PhetioGroupIO must have exactly one parameter type' );
      assert && assert( !!options.phetioType.parameterTypes[ 0 ], 'PhetioGroupIO parameterType must be truthy' );
      assert && assert( options.tandem.name.endsWith( 'Group' ), 'PhetioGroup tandems should end with Group suffix' );

      super( options );

      // @private
      this.createMember = createMember;

      // @public (read-only)
      this.array = [];

      // @private
      this.memberCreatedEmitter = new Emitter( { parameters: [ { isValidValue: _.stubTrue } ] } );
      this.memberDisposedEmitter = new Emitter( { parameters: [ { isValidValue: _.stubTrue } ] } );

      // @public (only for PhetioGroupIO) - for generating indices from a pool
      this.groupMemberIndex = 0;

      // @private
      this.prefix = prefix;

      // @public (read-only) {PhetioObject|null} Can be used as an argument to create other prototypes
      this.archetype = PhetioDynamicUtil.createArchetype( this.tandem, createMember, defaultArguments );
    }

    /**
     * @param {function} listener
     * @public
     */
    addMemberCreatedListener( listener ) {
      this.memberCreatedEmitter.addListener( listener );
    }

    /**
     * @param {function} listener
     * @public
     */
    removeMemberCreatedListener( listener ) {
      this.memberCreatedEmitter.removeListener( listener );
    }

    /**
     * @param {function} listener
     * @public
     */
    addMemberDisposedListener( listener ) {
      this.memberDisposedEmitter.addListener( listener );
    }

    /**
     * @param {function} listener
     * @public
     */
    removeMemberDisposedListener( listener ) {
      this.memberDisposedEmitter.removeListener( listener );
    }

    /**
     * Remove an member from this Group, unregistering it from PhET-iO and disposing it.
     * @param member
     * @public
     */
    disposeMember( member ) {
      arrayRemove( this.array, member );
      this.memberDisposedEmitter.emit( member );
      member.dispose();
    }

    /**
     * Returns the member at the specified index
     * @param {number} index
     * @returns {Object}
     */
    get( index ) {
      return this.array[ index ];
    }

    /**
     * Get number of Group members
     * @returns {number}
     * @public
     */
    get length() { return this.array.length; }

    /**
     * Returns an array with elements that pass the filter predicate.
     * @param {function} predicate
     * @returns {Object[]}
     * @public
     */
    filter( predicate ) { return this.array.filter( predicate ); }

    /**
     * Returns true if the group contains the specified object.
     * @param {Object} member
     * @returns {boolean}
     * @public
     */
    contains( member ) { return this.array.indexOf( member ) >= 0; }

    /**
     * Runs the function on each member of the group.
     * @param {function} action
     * @public
     */
    forEach( action ) { this.array.forEach( action ); }

    /**
     * Returns an array with every element mapped to a new one.
     * @param {function} f
     * @returns {Object[]}
     * @public
     */
    map( f ) { return this.array.map( f ); }

    /**
     * remove and dispose all registered group members
     * @public
     */
    clear() {
      while ( this.array.length > 0 ) {
        this.disposeMember( this.array[ this.array.length - 1 ] );
      }

      this.groupMemberIndex = 0;
    }

    /**
     * When creating a view element that corresponds to a specific model element, we match the tandem name index suffix
     * so that electron_0 corresponds to electronNode_0 and so on.
     * @param {PhetioObject} phetioObject
     * @param {...*} argsForCreateFunction - args to be passed to the create function, specified there are in the IO Type `stateToArgs` method
     * @returns {PhetioObject}
     * @public
     */
    createCorrespondingGroupMember( phetioObject, ...argsForCreateFunction ) {
      const index = phetio.PhetioIDUtils.getGroupMemberIndex( phetioObject.tandem.name );

      // If the specified index overlapped with the next available index, bump it up so there is no collision on the
      // next createNextMember
      if ( this.groupMemberIndex === index ) {
        this.groupMemberIndex++;
      }
      return this.createIndexedMember( index, argsForCreateFunction );
    }

    /**
     * Creates the next group member.
     * @param {...*} argsForCreateFunction - args to be passed to the create function, specified there are in the IO Type `stateToArgs` method
     * @returns {PhetioObject}
     * @public
     */
    createNextMember( ...argsForCreateFunction ) {
      return this.createIndexedMember( this.groupMemberIndex++, argsForCreateFunction );
    }

    /**
     * CreatPrimarily for internal use, clients should usually use createNextMember.
     * @param {number} index - the number of the individual member
     * @param {Array.<*>} argsForCreateFunction
     * @returns {Object}
     * @public (PhetioGroupIO)
     */
    createIndexedMember( index, argsForCreateFunction ) {

      const componentName = this.prefix + phetio.PhetioIDUtils.GROUP_SEPARATOR + index;

      const groupMember = PhetioDynamicUtil.createDynamicPhetioObject( this.tandem, componentName, this.createMember,
        argsForCreateFunction, this.phetioType.parameterTypes[ 0 ].validator );

      this.array.push( groupMember );
      this.memberCreatedEmitter.emit( groupMember );

      return groupMember;
    }
  }

  return tandemNamespace.register( 'PhetioGroup', PhetioGroup );
} );