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
  const DynamicTandem = require( 'TANDEM/DynamicTandem' );
  const Emitter = require( 'AXON/Emitter' );
  const merge = require( 'PHET_CORE/merge' );
  const phetioAPIValidation = require( 'TANDEM/phetioAPIValidation' );
  const PhetioObject = require( 'TANDEM/PhetioObject' );
  const Tandem = require( 'TANDEM/Tandem' );
  const tandemNamespace = require( 'TANDEM/tandemNamespace' );
  const validate = require( 'AXON/validate' );

  class PhetioGroup extends PhetioObject {

    /**
     * @param {string} prefix - like "particle" or "person" or "electron", and will be suffixed like "particle_0" // TODO: do we need this? why now something consistent like `element_0`
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
        phetioState: false
      }, options );

      assert && assert( !!options.phetioType, 'phetioType must be supplied' );
      assert && assert( !!options.phetioType.parameterType, 'PhetioCapsule is parametric, and needs a phetioType with a parameterType.' );

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

      this.groupOptions = options;

      // @private
      this.memberPrototype = null;

      // When generating the baseline, output the schema for the prototype
      if ( ( phet.phetio && phet.phetio.queryParameters.phetioPrintPhetioFiles ) || phetioAPIValidation.enabled ) {

        const args = Array.isArray( defaultArguments ) ? defaultArguments : defaultArguments();
        assert && assert( createMember.length === args.length + 1, 'mismatched number of arguments' );

        this.memberPrototype = createMember( this.tandem.createTandem( 'prototype' ), ...args );

        // So that the prototype get's included in the baseline schema
        this.memberPrototype.isDynamicElementPrototype = true;
        assert && PhetioGroup.assertDynamicPhetioObject( this.memberPrototype );
      }
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
    disposeGroupMember( member ) { // TODO: rename disposeMember
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
        this.disposeGroupMember( this.array[ this.array.length - 1 ] );
      }

      this.groupMemberIndex = 0;
    }

    /**
     * When creating a view element that corresponds to a specific model element, we match the tandem name index suffix
     * so that electron_0 corresponds to electronNode_0 and so on.
     * @param {PhetioObject} phetioObject
     * @param {...*} argsForCreateFunction - args to be passed to the create function, specified there are in the IO Type `stateObjectToArgs` method
     * @returns {PhetioObject}
     * @public
     */
    createCorrespondingGroupMember( phetioObject, ...argsForCreateFunction ) {
      const index = parseInt( phetioObject.tandem.name.split( phetio.PhetioIDUtils.GROUP_SEPARATOR )[ 1 ], 10 );

      // If the specified index overlapped with the next available index, bump it up so there is no collision on the
      // next createNextMember
      if ( this.groupMemberIndex === index ) {
        this.groupMemberIndex++;
      }
      return this.createIndexedMember( index, argsForCreateFunction );
    }

    /**
     * Creates the next group member.
     * @param {...*} argsForCreateFunction - args to be passed to the create function, specified there are in the IO Type `stateObjectToArgs` method
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
      assert && assert( Array.isArray( argsForCreateFunction ), 'should be array' );

      const componentName = this.prefix + phetio.PhetioIDUtils.GROUP_SEPARATOR + index;

      // create with default state and substructure, details will need to be set by setter methods.
      // TODO: getExtendOptions isn't needed here, and likely we shouldn't store this.groupOptions
      const groupMemberTandem = new DynamicTandem( this.tandem, componentName, this.tandem.getExtendedOptions( this.groupOptions ) );
      const groupMember = this.createMember( groupMemberTandem, ...argsForCreateFunction );

      // Make sure the new group member matches the schema for members.
      validate( groupMember, this.phetioType.parameterType.validator );
      assert && PhetioGroup.assertDynamicPhetioObject( groupMember );

      this.array.push( groupMember );
      this.memberCreatedEmitter.emit( groupMember );

      return groupMember;
    }

    /**
     * A dynamic member should be an instrumented PhetioObject with phetioDynamicElement: true
     * @param {PhetioObject} phetioObject - object to be validated
     * @public
     * @static
     */
    static assertDynamicPhetioObject( phetioObject ) {
      if ( Tandem.PHET_IO_ENABLED ) {
        assert && assert( phetioObject instanceof PhetioObject, 'instance should be a PhetioObject' );
        assert && assert( phetioObject.isPhetioInstrumented(), 'instance should be instrumented' );
        assert && assert( phetioObject.phetioDynamicElement, 'instance should be marked as phetioDynamicElement:true' );
      }
    }
  }

  return tandemNamespace.register( 'PhetioGroup', PhetioGroup );
} );