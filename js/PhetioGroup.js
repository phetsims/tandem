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
  const PhetioDynamicElementContainer = require( 'TANDEM/PhetioDynamicElementContainer' );
  const Tandem = require( 'TANDEM/Tandem' );
  const tandemNamespace = require( 'TANDEM/tandemNamespace' );

  // strings
  const groupString = 'Group';

  class PhetioGroup extends PhetioDynamicElementContainer {

    /**
     * @param {function} createMember - function that creates a group member
     * @param {Array.<*>|function.<[],Array.<*>>} defaultArguments arguments passed to create during API harvest
     * @param {Object} [options] - describe the Group itself
     */
    constructor( createMember, defaultArguments, options ) {

      options = merge( {
        phetioState: false, // members are included in state, but the container will exist in the downstream sim.
        tandem: Tandem.REQUIRED,

        // By default, a PhetioGroup's members are included in state such that on every setState call, the members are
        // cleared out by the phetioStateEngine so members in the state can be added to the empty group. This option is
        // for opting out of that behavior. NOTE: Only use when it's guaranteed that all of the members are
        // created on startup, and never at any point later during the sim's lifetime. When this is set to false, there
        // is no need for members to support dynamic state.
        supportsDynamicState: true
      }, options );

      assert && assert( !!options.phetioType, 'phetioType must be supplied' );
      assert && assert( !!options.phetioType.parameterTypes, 'PhetioGroupIO must supply its parameter types' );
      assert && assert( options.phetioType.parameterTypes.length === 1, 'PhetioGroupIO must have exactly one parameter type' );
      assert && assert( !!options.phetioType.parameterTypes[ 0 ], 'PhetioGroupIO parameterType must be truthy' );
      assert && assert( options.tandem.name.endsWith( groupString ), 'PhetioGroup tandems should end with Group suffix' );

      // options that depend on other options
      options = merge( {

        // {string} - the PhetioGroup tandem name without the "Group" suffix
        phetioDynamicElementName: options.tandem.name.slice( 0, options.tandem.name.length - groupString.length )
      }, options );

      super(  createMember, defaultArguments,options );

      // @private
      this.createMember = createMember;

      // @public (read-only)
      this.array = [];

      // @private
      this.memberCreatedEmitter = new Emitter( { parameters: [ { isValidValue: _.stubTrue } ] } );
      this.memberDisposedEmitter = new Emitter( { parameters: [ { isValidValue: _.stubTrue } ] } );

      // @public (only for PhetioGroupIO) - for generating indices from a pool
      this.groupMemberIndex = 0;

      // @private {string}
      this.prefix = options.phetioDynamicElementName;

      // Emit to the data stream on member creation/disposal
      this.addMemberCreatedListener( member => this.createdEventListener( member ) );
      this.addMemberDisposedListener( member => this.disposedEventListener( member ) );
    }

    /**
     * @public
     */
    dispose() {
      assert && assert( false, 'PhetioGroup not intended for disposal' );
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
     * @param {...*} argsForCreateFunction - args to be passed to the create function, specified there are in the IO Type `stateToArgsForConstructor` method
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
     * @param {...*} argsForCreateFunction - args to be passed to the create function, specified there are in the IO Type `stateToArgsForConstructor` method
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

      const groupMember = this.createDynamicElement( componentName, this.createMember,
        argsForCreateFunction, this.phetioType.parameterTypes[ 0 ] );

      this.array.push( groupMember );
      this.memberCreatedEmitter.emit( groupMember );

      return groupMember;
    }
  }

  return tandemNamespace.register( 'PhetioGroup', PhetioGroup );
} );