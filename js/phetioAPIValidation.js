// Copyright 2019, University of Colorado Boulder

/**
 * This singleton is responsible for ensuring that the phet-io api is correct through the lifetime of the simulation.
 * The complete list of checks was decided on in https://github.com/phetsims/phet-io/issues/1453 and is as follows:
 *
 * 1. A full schema is required
 * 2. Registered PhetioObject baseline must equal baseline schema to ensure that baseline changes are intentional.
 * 3. Any registered PhetioObject must be included in the schema.
 * 4. After startup, only dynamic instances can be registered.
 * 5. When the sim is finished starting up, all schema entries must be registered.
 * 6. Any static, registered PhetioObject can never be deregistered.
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

      if ( phet.phetio.queryParameters.phetioValidateAPI ) {

        if ( !this.simHasStarted && !phet.phetio.queryParameters.phetioPrintPhetioElementsBaseline ) {

          // check for existence of preloaded api schemas
          // Testing rule: "1. A full schema is required"
          assert && assert( window.phet.phetio.phetioElementsBaseline, 'no baseline schema found, a full schema is required.' );
          assert && assert( window.phet.phetio.phetioElementsOverrides, 'no overrides schema found, a full schema is required' );

          const concretePhetioID = tandem.getConcretePhetioID();
          const baseline = window.phet.phetio.phetioElementsBaseline[ concretePhetioID ];

          if ( !baseline ) {
            this.addError( {
              phetioID: tandem.phetioID,
              ruleInViolation: '3. Any registered PhetioObject must be included in the schema',
              message: 'no baseline schema found for phetioID',
              concretePhetioID: concretePhetioID
            } );
            return;
          }

          // if simulation metadata is not equal to baseline before overrides applied
          if ( !_.isEqual( baseline, phetioObjectBaselineMetadata ) ) {
            this.addError( {
              phetioID: concretePhetioID,
              ruleInViolation: '2. Registered PhetioObject baseline must equal baseline schema to ensure that baseline changes are intentional.',
              message: 'baseline schema does not match PhetioObject computed baseline metadata',
              baselineSchema: baseline,
              phetioObjectBaselineMetadata: phetioObjectBaselineMetadata
            } );
          }
        }

        // Instances should generally be created on startup.  The only instances that it's OK to create after startup
        // are "dynamic instances" which have underscores (at the moment). Only assert if validating the phet-io API
        if ( this.simHasStarted && !phetio.PhetioIDUtils.isDynamicElement( tandem.phetioID ) ) {
          this.addError( {
            phetioID: tandem.phetioID,
            ruleInViolation: '4. After startup, only dynamic instances can be registered.'
          } );
        }
      }
    }

    /**
     * Callback when the simulation is ready to go, and all static PhetioObjects have been created.
     * @param {Object.<string,PhetioObject>} phetioObjectMap
     * @public
     */
    onSimStarted( phetioObjectMap ) {

      // (a) When screens are specified, there will be many things in the baseline file but not in the sim.  Those will
      // not be validated.
      // (b) Allow developers to opt-out of checking
      // (c) When printing a new baseline file, we do not compare against the prior stale baseline file.
      if ( phet.chipper.queryParameters.screens === null &&
           phet.phetio.queryParameters.phetioValidateAPI &&
           !phet.phetio.queryParameters.phetioPrintPhetioElementsBaseline ) {

        // check to make sure all phetioElementAPI entries were used.  If an entry wasn't used, throw an assertion
        // error because the sim is missing something it is supposed to have.
        // Don't check for this when generating the API file from the code.
        for ( const phetioID in window.phet.phetio.phetioElementsBaseline ) {
          if ( window.phet.phetio.phetioElementsBaseline.hasOwnProperty( phetioID ) && !phetioObjectMap[ phetioID ] ) {
            this.addError( {
              phetioID: phetioID,
              ruleInViolation: '5. When the sim is finished starting up, all schema entries must be registered.',
              message: 'phetioID expected but does not exist'
            } );
          }
        }

        this.assertOutIfErrorsPresent();
      }
      this.simHasStarted = true;
    }

    onPhetioObjectRemoved( phetioObject ) {
      const phetioID = phetioObject.tandem.phetioID;

      // if it isn't dynamic, then it shouldn't be removed during the lifetime of the sim.
      if ( !phetioObject.tandem.isGroupMemberOrDescendant() &&

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
     * If there are errors, then assert out and log them.
     * @private
     */
    assertOutIfErrorsPresent() {

      // if there are any api mismatches
      if ( assert && this.apiMismatches.length > 0 ) {
        console.log( 'mismatches:', this.apiMismatches );
        assert( false, 'api mismatches present:\n' + this.apiMismatches.map(
          mismatchData => `\n${mismatchData.phetioID}:  ${mismatchData.ruleInViolation}`
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