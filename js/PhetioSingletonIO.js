// Copyright 2019, University of Colorado Boulder

/**
 * IO type for PhetioSingleton.
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
      const PhetioGroup = window.phet ? phet.tandem.PhetioSingleton : tandemNamespace.PhetioSingleton;
      return v instanceof PhetioGroup;
    }
  };

  // {Object.<parameterTypeName:string, function(new:ObjectIO)>} - cache each parameterized PropertyIO so that it is
  // only created once.
  const cache = {};

  /**
   * Parametric IO type constructor.  Given an element type, this function returns a PhetioSingleton IO type.
   * @param {function(new:ObjectIO)} parameterType
   * @returns {function(new:ObjectIO)}
   * @constructor
   */
  function PhetioSingletonIO( parameterType ) {

    assert && assert( typeof parameterType === 'function', 'element type should be defined' );

    if ( !cache.hasOwnProperty( parameterType.typeName ) ) {
      cache[ parameterType.typeName ] = create( parameterType );
    }

    return cache[ parameterType.typeName ];
  }

  /**
   * Creates a PhetioSingletonIOImpl
   * @param {function(new:ObjectIO)} parameterType
   * @returns {function(new:ObjectIO)}
   */
  const create = parameterType => {

    class PhetioSingletonIOImpl extends ObjectIO {

      /**
       * Creates the singleton's instance.
       * @param {PhetioSingleton} singleton
       * @param {string} componentName
       * @param {Object} stateObject
       * @throws CouldNotYetDeserializeError - if it could not yet deserialize
       */
      static addChildInstanceFromComponentName( singleton, componentName, stateObject ) {

        // should throw CouldNotYetDeserializeError if it can't be created yet. Likely that would be because another
        // element in the state needs to be created first, so we will try again on the next iteration of the state
        // setting engine.
        const args = parameterType.stateObjectToArgs( stateObject );

        return singleton.create( ...args );
      }

      /**
       * @public (phet-io state)
       * @param {PhetioSingleton} singleton
       */
      static clearChildInstances( singleton ) {
        if ( singleton.instance ) {
          singleton.disposeInstance();
        }
      }
    }

    PhetioSingletonIOImpl.documentation = 'An array that sends notifications when its values have changed.';
    PhetioSingletonIOImpl.validator = GROUP_VALIDATOR;
    PhetioSingletonIOImpl.typeName = `PhetioSingletonIO<${parameterType.typeName}>`;
    PhetioSingletonIOImpl.parameterType = parameterType; // TODO: zepumph hopes we can get rid of this, https://github.com/phetsims/phet-io/issues/1371
    PhetioSingletonIOImpl.parameterTypes = [ parameterType ]; // TODO: samreid hopes we can get rid of this, https://github.com/phetsims/phet-io/issues/1371
    ObjectIO.validateSubtype( PhetioSingletonIOImpl );

    return PhetioSingletonIOImpl;
  };

  return tandemNamespace.register( 'PhetioSingletonIO', PhetioSingletonIO );
} );

