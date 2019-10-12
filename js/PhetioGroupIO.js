// Copyright 2019, University of Colorado Boulder

/**
 * IO type for Group. TODO: this was copy/pasted from ObservableArrayIO.  It should either subclass it or be rewritten.
 * TODO: or better decoupled.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Chris Klusendorf (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */
define( require => {
  'use strict';

  // modules
  const ObjectIO = require( 'TANDEM/types/ObjectIO' );
  const tandemNamespace = require( 'TANDEM/tandemNamespace' );

  // constants
  const GROUP_VALIDATOR = {
    isValidValue: v => {
      const PhetioGroup = window.phet ? phet.tandem.PhetioGroup : tandemNamespace.PhetioGroup;
      return v instanceof PhetioGroup;
    }
  };

  /**
   * Parametric IO type constructor.  Given an element type, this function returns an ObservableArray IO type.
   * @param {function(new:ObjectIO)} parameterType - IO type of the DerivedProperty. If loaded by phet (not phet-io)
   *                                    it will be the function returned by the 'ifphetio!' plugin.
   * @returns {function(new:ObjectIO)}
   * @constructor
   */
  function PhetioGroupIO( parameterType ) {

    assert && assert( typeof ( parameterType ) === 'function', 'element type should be defined' );

    class PhetioGroupIOImpl extends ObjectIO {

      // TODO https://github.com/phetsims/phet-io/issues/1454 I chose a different method name to remain backward
      // TODO: compatible with legacy group patterns
      // TODO https://github.com/phetsims/phet-io/issues/1454 move this to PhetioGroupIO
      /**
       * Adds a Track as specified by the phetioID and state.
       * A Track will create its own ControlPoints
       * @param {PhetioGroup} group
       * @param {string} componentName
       * @param {Object} stateObject
       * @throws CouldNotYetDeserializeError - if it could not yet deserialize
       */
      static addChildInstanceFromComponentName( group, componentName, stateObject ) {

        // should throw CouldNotYetDeserializeError if it can't be created yet. Likely that would be because another
        // element in the state needs to be created first, so we will try again on the next iteration of the state
        // setting engine.
        const args = parameterType.stateObjectToArgs( stateObject );

        // TODO: factor this out to PhetioIDUtils (see usage in PhetioGroup.js too)
        const index = parseInt( componentName.split( phetio.PhetioIDUtils.GROUP_SEPARATOR )[ 1 ], 10 );
        const groupMember = group.createGroupMember( index, args );

        // Keep the groupMemberIndex in sync so that the next index is set appropriately. This covers the case where
        // no members have been created in the sim, instead they have only been set via state.
        group.groupMemberIndex = Math.max( index + 1, group.groupMemberIndex );

        return groupMember;
      }

      /**
       * @public (phet-io state)
       * @param {PhetioGroup} group
       */
      static clearChildInstances( group ) {
        group.clear();
      }
    }

    PhetioGroupIOImpl.documentation = 'An array that sends notifications when its values have changed.';
    PhetioGroupIOImpl.validator = GROUP_VALIDATOR;
    PhetioGroupIOImpl.typeName = `PhetioGroupIO<${parameterType.typeName}>`;
    PhetioGroupIOImpl.parameterType = parameterType; // TODO: zepumph hopes we can get rid of this, https://github.com/phetsims/phet-io/issues/1371
    PhetioGroupIOImpl.parameterTypes = [ parameterType ]; // TODO: samreid hopes we can get rid of this, https://github.com/phetsims/phet-io/issues/1371
    ObjectIO.validateSubtype( PhetioGroupIOImpl );

    return PhetioGroupIOImpl;
  }

  tandemNamespace.register( 'PhetioGroupIO', PhetioGroupIO );

  return PhetioGroupIO;
} );

