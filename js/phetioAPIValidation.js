// Copyright 2019, University of Colorado Boulder

/**
 * This singleton is responsible for ensuring that the phet-io api is correct through the lifetime of the simulation.
 * The phet-io api is defined through multiple preloaded files. The "elements baseline" file holds an exact match of
 * what PhetioObject instances/metadata the sim should create on startup, where the "elements overrides" file is a
 * sparse list that can overwrite metadata without changing the code. See `grunt generate-phet-io-elements-files` for
 * more information. The complete list of checks was decided on in https://github.com/phetsims/phet-io/issues/1453 and
 * is as follows:
 *
 * 1. A full schema is required - any phet-io brand sim without these will have a 404, but this rule isn't tested in this file.
 * 2. Registered PhetioObject baseline must equal baseline schema to ensure that baseline changes are intentional.
 * 3. ~~ is no more
 * 4. After startup, only dynamic instances can be registered.
 * 5. When the sim is finished starting up, all non-dynamic schema entries must be registered.
 * 6. Any static, registered PhetioObject can never be deregistered.
 * 7. Any schema entries in the overrides file must exist in the baseline file
 * 8. Any schema entries in the overrides file must be different from its baseline counterpart
 * 9. Types in the sim must exactly match types in the types file to ensure that type changes are intentional.
 * 10. Newly created TypeIOs cannot have the same typeName but be a different TypeIO implementation.
 *
 * Terminology:
 * schema: specified through preloads. The full schema is the baseline plus the overrides, but those parts can be
 *         referred to separately.
 * registered: the process of instrumenting a PhetioObject and it "becoming" a PhET-iO Element on the wrapper side.
 * static PhetioObject: A registered PhetioObject that exists for the lifetime of the sim. It should not be removed
 *                      (even intermittently) and must be created during startup so that it is immediately interoperable.
 * dynamic PhetioObject: A registered PhetioObject that can be created and/or destroyed at any point. Only dynamic
 *                       PhetioObjects can be created after startup.
 *
 * See https://github.com/phetsims/phet-io/issues/1443#issuecomment-484306552 for an explanation of how to maintain the
 * PhET-iO API for a simulation.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 * @author Chris Klusendorf (PhET Interactive Simulations)
 */
define( require => {
  'use strict';

  // modules
  const tandemNamespace = require( 'TANDEM/tandemNamespace' );

  class PhetioAPIValidation {

    constructor() {

      /**
       * {Object[]} - Each object holds a single "api mismatch" with the following keys:
       *                phetioID: {string}
       *                stack: {string} - for a stack trace
       *                ruleInViolation: {string} - one of the numbered list in the header doc.
       *                [message]: {string} - specific problem
       *
       * Feel free to add any other JSONifyable keys to this to make the error more clear! All mismatches are printed
       * at once for clarity, see PhetioEngine.
       * @private
       */
      this.apiMismatches = [];

      // @private - keep track of when the sim has started.
      this.simHasStarted = false;

      // @public (read-only) {boolean} - whether or not validation is enabled.
      this.enabled = !!( window.phet && window.phet.phetio && window.phet.phetio.queryParameters.phetioValidateAPI &&
                         window.phet.phetio.phetioElementsOverrides &&
                         window.phet.phetio.phetioElementsBaseline &&
                         window.phet.phetio.phetioTypes &&
                         !phet.phetio.queryParameters.phetioPrintPhetioFiles );

      // @private {Object.<typeName:string, function(new:ObjectIO)>} - this must be all phet-io types so that the
      // following would fail:  add a phetioType, then remove it, then add a different one under the same typeName.
      // A Note about memory: Every TypeIO that is loaded through requirejs is already loaded on the namespace. Therefore
      // this map doesn't add any memory by storing these. The exception to this is parametric TypeIOs. It should be
      // double checked that anything being passed into a parametric type is memory safe. As of this writing, only TypeIOs
      // are passed to parametric TypeIOs, so this pattern remains memory leak free. Furthermore, this list is only
      // populated when `this.enabled`.
      this.everyPhetioType = {};

      this.validateOverridesFile(); // these preloads can be validated immediately
    }

    /**
     * This callback should be called before the overrides have been mixed into the PhetioObject metadata to ensure that
     * the comparison is baseline schema (from the file) to PhetioObject baseline (computed at runtime).
     *
     * @param {Tandem} tandem
     * @param {Object} phetioObjectBaselineMetadata
     * @public
     */
    onPhetioObjectPreOverrides( tandem, phetioObjectBaselineMetadata ) {
      if ( this.enabled && this.simHasStarted ) {
        const concretePhetioID = tandem.getConcretePhetioID();
        const baseline = window.phet.phetio.phetioElementsBaseline[ concretePhetioID ];

        // Instances should generally be created on startup.  The only instances that it's OK to create after startup
        // are "dynamic instances" which have underscores (at the moment). Only assert if validating the phet-io API
        const isDynamicElement = phetio.PhetioIDUtils.isDynamicElement( tandem.phetioID ) || baseline.phetioDynamicElement;
        if ( !isDynamicElement ) {
          this.addError( {
            phetioID: tandem.phetioID,
            ruleInViolation: '4. After startup, only dynamic instances can be registered.'
          } );
        }
      }
    }

    /**
     * Callback when the simulation is ready to go, and all static PhetioObjects have been created.
     * @param {PhetioEngine} phetioEngine
     * @public
     */
    onSimStarted( phetioEngine ) {
      if ( !this.enabled ) {
        return;
      }

      const phetioElementsBaseline = phetioEngine.getPhetioElementsBaseline();
      const phetioTypes = phetioEngine.getPhetioTypes();

      // When the screens query parameter is specified, there will be many things in the baseline file but not in the sim.  Those will
      // not be validated.
      if ( phet.chipper.queryParameters.screens === null ) {

        // check to make sure all phet-io elements and type entries were used.  If an entry wasn't used, throw an
        // assertion error because the sim is missing something it is supposed to have.
        // Don't check for this when generating the API file from the code.
        for ( const phetioID in window.phet.phetio.phetioElementsBaseline ) {
          if (
            window.phet.phetio.phetioElementsBaseline.hasOwnProperty( phetioID ) &&
            !phetioEngine.phetioObjectMap[ phetioID ]
            && !window.phet.phetio.phetioElementsBaseline[ phetioID ].phetioDynamicElement
          ) {
            this.addError( {
              phetioID: phetioID,
              ruleInViolation: '5. When the sim is finished starting up, all non-dynamic schema entries must be registered.',
              message: 'phetioID expected but does not exist'
            } );
          }
        }

        if ( !_.isEqual( phetioElementsBaseline, window.phet.phetio.phetioElementsBaseline ) ) {
          this.addError( {
            // Note: this breaks rule 2 which may in some cases be rule 3
            ruleInViolation: '2. Registered PhetioObject baseline must equal baseline schema to ensure that baseline changes are intentional.',
            message: 'baseline schema does not match PhetioObject computed baseline metadata',
            phetioElementsBaseline: phetioElementsBaseline,
            stringifiedBaseline: JSON.stringify( window.phet.preloads.phetCore.copyWithSortedKeys( phetioElementsBaseline ), null, 2 ),
            phetioElementsBaselineFromFile: window.phet.phetio.phetioElementsBaseline
          } );
        }

        if ( !_.isEqual( phetioTypes, window.phet.phetio.phetioTypes ) ) {
          const phetioTypesKeys = Object.keys( phetioTypes );
          const windowPhetioTypesKeys = Object.keys( window.phet.phetio.phetioTypes );

          this.addError( {
            ruleInViolation: '9. Types in the sim must exactly match types in the types file to ensure that type changes are intentional.',
            message: 'phetioTypes are not equivalent',
            areKeysEquivalent: _.isEqual( phetioTypesKeys.sort(), windowPhetioTypesKeys.sort() ),
            typesNotInSim: windowPhetioTypesKeys.filter( x => !phetioTypesKeys.includes( x ) ),
            typesNotInFile: phetioTypesKeys.filter( x => !windowPhetioTypesKeys.includes( x ) )
          } );
        }

        this.assertOutIfErrorsPresent();
      }

      this.simHasStarted = true;
    }

    /**
     * Checks if a removed phetioObject is part of a Group
     * @param {PhetioObject} phetioObject
     * @public
     */
    onPhetioObjectRemoved( phetioObject ) {
      if ( !this.enabled ) {
        return;
      }

      const phetioID = phetioObject.tandem.phetioID;

      // if it isn't dynamic, then it shouldn't be removed during the lifetime of the sim.
      if ( !phetio.PhetioIDUtils.isDynamicElement( phetioObject.tandem.phetioID ) &&

           // TODO: Remove '~' check once TANDEM/Tandem.GroupTandem usages have been replaced, see https://github.com/phetsims/tandem/issues/87
           phetioID.indexOf( '~' ) === -1
      ) {
        this.addError( {
          phetioID: phetioID,
          ruleInViolation: '6. Any static, registered PhetioObject can never be deregistered.'
        } );
      }
    }

    /**
     * Should be called from phetioEngine when a PhetioObject is added to the PhET-iO
     * @param {PhetioObject} phetioObject
     * @public
     */
    onPhetioObjectAdded( phetioObject ) {
      if ( !this.enabled ) {
        return;
      }

      const newPhetioType = phetioObject.phetioType;
      const oldPhetioType = this.everyPhetioType[ newPhetioType.typeName ];

      // test reciprocally to prevent false positives, for example an EmitterIO is an ActionIO, but an ActionIO isn't EmitterIO.
      if ( oldPhetioType && ( !newPhetioType.equals( oldPhetioType ) || !oldPhetioType.equals( newPhetioType ) ) ) {
        this.addError( {
          phetioID: phetioObject.tandem.phetioID,
          ruleInViolation: '10. Newly created TypeIOs cannot have the same typeName but be a different TypeIO implementation.'
        } );
      }
      if ( !oldPhetioType ) { // This may not be necessary, but may be helpful so that we don't overwrite if rule 10 is in violation
        this.everyPhetioType[ newPhetioType.typeName ] = newPhetioType;
      }
    }

    /**
     * @private
     */
    validateOverridesFile() {
      if ( !this.enabled ) {
        return;
      }

      for ( const phetioID in window.phet.phetio.phetioElementsOverrides ) {
        if ( !window.phet.phetio.phetioElementsBaseline.hasOwnProperty( phetioID ) ) {
          this.addError( {
            phetioID: phetioID,
            ruleInViolation: '7. Any schema entries in the overrides file must exist in the baseline file.',
            message: 'phetioID expected in the baseline file but does not exist'
          } );
        }
        else {

          const override = window.phet.phetio.phetioElementsOverrides[ phetioID ];
          const baseline = window.phet.phetio.phetioElementsBaseline[ phetioID ];

          if ( Object.keys( override ).length === 0 ) {
            this.addError( {
              phetioID: phetioID,
              ruleInViolation: '8. Any schema entries in the overrides file must be different from its baseline counterpart.',
              message: 'no metadata keys found for this override.'
            } );
          }

          for ( const metadataKey in override ) {
            if ( !baseline.hasOwnProperty( metadataKey ) ) {
              this.addError( {
                phetioID: phetioID,
                ruleInViolation: '8. Any schema entries in the overrides file must be different from its baseline counterpart.',
                message: `phetioID metadata key not found in the baseline: ${metadataKey}`
              } );
            }
            if ( override[ metadataKey ] === baseline[ metadataKey ] ) {
              this.addError( {
                phetioID: phetioID,
                ruleInViolation: '8. Any schema entries in the overrides file must be different from its baseline counterpart.',
                message: 'phetioID metadata override value is the same as the corresponding metadata value in the baseline.'
              } );
            }
          }
        }
      }

      this.assertOutIfErrorsPresent();
    }

    /**
     * If there are errors, then assert out and log them.
     * @private
     */
    assertOutIfErrorsPresent() {

      // if there are any api mismatches
      if ( assert && this.apiMismatches.length > 0 ) {
        console.log( 'mismatches:', this.apiMismatches );
        assert( false, 'api mismatches present:\n' + this.apiMismatches.map( mismatchData => {
            if ( mismatchData.phetioID ) {
              return `\n${mismatchData.phetioID}:  ${mismatchData.ruleInViolation}`;
            }
            else {
              return `${mismatchData.ruleInViolation}`;
            }
          }
        ) );
      }
    }

    /**
     * Add an api error to the list to be flushed on sim completion, or immediately if the sim has already started.
     * @param {Object} apiErrorObject - see doc for this.apiMismatches
     * @private
     */
    addError( apiErrorObject ) {
      apiErrorObject.stack = new Error().stack;

      this.apiMismatches.push( apiErrorObject );

      // if the sim has already started, then immediately error out
      if ( this.simHasStarted ) {
        this.assertOutIfErrorsPresent();
      }
    }
  }

  return tandemNamespace.register( 'phetioAPIValidation', new PhetioAPIValidation() );
} );