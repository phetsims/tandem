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
  const tandemNamespace = require( 'TANDEM/tandemNamespace' );

  // constants
  const GROUP_SEPARATOR = phetio.PhetioIDUtils.GROUP_SEPARATOR;

  // Create the corresponding tandem name for a specific key
  const keyToPrototypeName = key => 'prototype' + StringUtils.capitalize( key );

  class Group extends ObservableArray {

    /**
     * @param {string} [prefix]
     * @param {Object.<string,function>|function} prototypeSchema
     *   For homogeneous groups, a function that returns the sole prototype.
     *   For heterogeneous groups, a map of prototype name to function that returns the prototype for that type.
     * @param {Object} [options] - describe the Group itself
     */
    constructor( prefix = 'element', prototypeSchema, options ) {

      options = _.extend( {
        phetioType: GroupIO,
        phetioState: false
      }, options );

      super( options );

      // @private - for generating indices from a pool
      this.groupElementIndex = 0;

      // @private
      this.prefix = prefix;

      // @private {Object.<string,function>|function}
      this.prototypeSchema = prototypeSchema;

      this.groupOptions = options;

      // When generating the baseline, output the schema for the prototype(s)
      if ( phet.phetio && phet.phetio.queryParameters.phetioPrintPhetioFiles ) {

        // create with any default state and nested substructure
        // TODO: support var args

        // this.prototypesTandem = this.tandem.createTandem( 'prototypes' );
        if ( typeof prototypeSchema === 'function' ) {
          const prototype = this.prototypeSchema( this.tandem.createTandem( 'prototype' ) );
          assert && Group.assertDynamicPhetioObject( prototype );
        }
        else {
          Object.keys( prototypeSchema ).forEach( key => {
            const prototype = this.prototypeSchema[ key ]( this.tandem.createTandem( keyToPrototypeName( key ) ) );
            assert && Group.assertDynamicPhetioObject( prototype );
          } );
        }
      }

      // There cannot be any items in the Group yet, and here we check for subsequently added items.
      assert && this.addItemAddedListener( Group.assertDynamicPhetioObject );
    }

    /**
     * Creates the next tandem in the group.
     * @param {string} prototypeName - for creating Tandems for Groups. This string creates an association between
     *                                    and instance and a group prototype, see GroupMemberTandem.
     * @param {Object} [options]
     * @returns {GroupMemberTandem}
     * @public
     * TODO: what is this method for?
     */
    createNextTandem( prototypeName, options ) {
      return new GroupMemberTandem(
        this.tandem,
        this.prefix + GROUP_SEPARATOR + ( this.groupElementIndex++ ),
        prototypeName ? keyToPrototypeName( prototypeName ) : 'prototype',
        this.tandem.getExtendedOptions( options )
      );
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
    createNextGroupMember( prototypeName ) {
      assert && assert( typeof this.prototypeSchema === 'function' || this.prototypeSchema.hasOwnProperty( prototypeName ), 'prototype should match' );
      return this.createGroupMember( this.prefix + GROUP_SEPARATOR + ( this.groupElementIndex++ ), prototypeName );
    }

    /**
     * @param {string} componentName - the name of the individual member
     * @param {string} [prototypeName] required for heterogeneous groups
     * @returns {Object}
     * @private
     */
    createGroupMember( componentName, prototypeName ) {

      // create with default state and substructure, details will need to be set by setter methods.
      const createMember = typeof this.prototypeSchema === 'function' ? this.prototypeSchema : this.prototypeSchema[ prototypeName ];
      const groupMember = createMember( new GroupMemberTandem(
        this.tandem,
        componentName,
        prototypeName ? keyToPrototypeName( prototypeName ) : 'prototype',
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