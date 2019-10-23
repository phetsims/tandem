// Copyright 2019, University of Colorado Boulder

/**
 * IO type for PhetioCapsule.
 *
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
      const PhetioGroup = window.phet ? phet.tandem.PhetioCapsule : tandemNamespace.PhetioCapsule;
      return v instanceof PhetioGroup;
    }
  };

  // {Object.<parameterTypeName:string, function(new:ObjectIO)>} - cache each parameterized PropertyIO so that it is
  // only created once.
  const cache = {};

  /**
   * Parametric IO type constructor.  Given an element type, this function returns a PhetioCapsule IO type.
   * @param {function(new:ObjectIO)} parameterType
   * @returns {function(new:ObjectIO)}
   * @constructor
   */
  function PhetioCapsuleIO( parameterType ) {

    assert && assert( typeof parameterType === 'function', 'element type should be defined' );

    if ( !cache.hasOwnProperty( parameterType.typeName ) ) {
      cache[ parameterType.typeName ] = create( parameterType );
    }

    return cache[ parameterType.typeName ];
  }

  /**
   * Creates a PhetioCapsuleIOImpl
   * @param {function(new:ObjectIO)} parameterType
   * @returns {function(new:ObjectIO)}
   */
  const create = parameterType => {

    class PhetioCapsuleIOImpl extends ObjectIO {

      /**
       * Creates the capsule's instance.
       * @param {PhetioCapsule} capsule
       * @param {string} componentName
       * @param {Object} stateObject
       * @throws CouldNotYetDeserializeError - if it could not yet deserialize
       */
      static addChildInstanceFromComponentName( capsule, componentName, stateObject ) {

        // should throw CouldNotYetDeserializeError if it can't be created yet. Likely that would be because another
        // element in the state needs to be created first, so we will try again on the next iteration of the state
        // setting engine.
        const args = parameterType.stateObjectToArgs( stateObject );

        return capsule.create( ...args );
      }

      /**
       * @public (phet-io state)
       * @param {PhetioCapsule} capsule
       */
      static clearChildInstances( capsule ) {
        capsule.disposeInstance();
      }
    }

    PhetioCapsuleIOImpl.documentation = 'An array that sends notifications when its values have changed.';
    PhetioCapsuleIOImpl.validator = GROUP_VALIDATOR;
    PhetioCapsuleIOImpl.typeName = `PhetioCapsuleIO<${parameterType.typeName}>`;
    PhetioCapsuleIOImpl.parameterType = parameterType; // TODO: zepumph hopes we can get rid of this, https://github.com/phetsims/phet-io/issues/1371
    PhetioCapsuleIOImpl.parameterTypes = [ parameterType ]; // TODO: samreid hopes we can get rid of this, https://github.com/phetsims/phet-io/issues/1371
    ObjectIO.validateSubtype( PhetioCapsuleIOImpl );

    return PhetioCapsuleIOImpl;
  };

  return tandemNamespace.register( 'PhetioCapsuleIO', PhetioCapsuleIO );
} );

