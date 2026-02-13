/**
 * React hook for deploying ERC1155 multi-tokens
 */

import { useState, useCallback } from 'react';
import { getRpcEndpoint, getFactoryAddress, deployERC1155CollectionViaAPI } from '../deployment';
import type { 
  UseERC1155DeployOptions, 
  UseERC1155DeployReturn, 
  DeploymentState, 
  DeployMultiTokenParams,
  DeployMultiTokenResult,
} from '../types';

const DEFAULT_DEPLOYMENT_API_URL = 'http://localhost:4002';

export function useERC1155Deploy(options: UseERC1155DeployOptions): UseERC1155DeployReturn {
  const { 
    privateKey, 
    rpcEndpoint, 
    network,
    deploymentApiUrl = DEFAULT_DEPLOYMENT_API_URL,
  } = options;

  const [deploymentState, setDeploymentState] = useState<DeploymentState>({ status: 'idle' });
  const [error, setError] = useState<Error | null>(null);

  const actualRpcEndpoint = rpcEndpoint || getRpcEndpoint(network);
  const factoryAddress = getFactoryAddress(network);

  const deployMultiToken = useCallback(async (params: DeployMultiTokenParams): Promise<DeployMultiTokenResult> => {
    if (!privateKey) {
      throw new Error('Private key is required for deployment');
    }

    setError(null);
    setDeploymentState({ status: 'deploying' });

    try {
      // Deploy via API
      const result = await deployERC1155CollectionViaAPI({
        ...params,
        factoryAddress: params.factoryAddress || factoryAddress,
        privateKey,
        rpcEndpoint: actualRpcEndpoint,
        deploymentApiUrl,
      });

      setDeploymentState({ status: 'success', result });
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      setDeploymentState({ status: 'error', error });
      throw error;
    }
  }, [privateKey, actualRpcEndpoint, factoryAddress, deploymentApiUrl]);

  const reset = useCallback(() => {
    setDeploymentState({ status: 'idle' });
    setError(null);
  }, []);

  return {
    deployMultiToken,
    deploymentState,
    isDeploying: deploymentState.status === 'deploying' || 
                 deploymentState.status === 'activating' ||
                 deploymentState.status === 'initializing' ||
                 deploymentState.status === 'registering',
    error,
    reset,
  };
}
