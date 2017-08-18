# Loading packages here
import sys
import argparse
import numpy as np
import matplotlib
#import skbio as sb  # Use this for ANOSIM
import pandas as pd  # Use this for working with dataframes
import os
import networkx
import scipy.stats as stats
from sklearn.decomposition import PCA  # Use for PCA
import matplotlib.pyplot as plt  # Use this for plotting
#from skbio.stats.distance import anosim
import math
import csv
import minepy #pip install minepy
import pylab
import time

global min_count
global window_size


def remove_min_count(df, min_count):
    '''
    Function remove_min_count: This function removes data that is all zeros in a column
        best used once merging has taken place to get rid of all features that are zero in both conditions
    :param df: @type pandas dataframe: The data to remove counts below min_count
    :return: @type pandas dataframe: The resulting dataframe after removal
    '''
    return (df.loc[:, (df > min_count).any(axis=0)])

def add_one_smoothing(df):
    '''
    Function add_one_smoothing: Adds one accounts for the possibility of unseen events (0s) occurring in the future.
    :param df: @type pandas dataframe: The data to smooth
    :return: @type pandas dataframe: The smoothed data
    '''
    temp = df.copy() + 1
    temp = temp / df.sum()
    return temp

def hellinger(df):
    '''
    Function hellinger: The hellinger transformation deals with the double zero problem in ecology.
            The hellinger transformation is the square root of the result of the current row
            divided by the sum of all rows. This is done for each element in the dataframe.
    :param df: @type pandas dataframe: The data to do the transformation on.
    :return: @type pandas dataframe: A dataframe of the hellinger transformed data.
    '''
    temp = df.copy()
    hellinger_data = np.sqrt(temp.div(temp.sum(axis=1), axis=0))  # Hellinger transformation
    return hellinger_data

def condition(df, cond_type):
    '''
    Function condition: A preprocessing step to condition the data based on the type specidied
    :param data: @type pandas dataframe - The data to be conditioned
    :param cond_type: @type string - The type of conditioning to run. Valid values: add_one, hellinger
    :return: @type pandas dataframe - The conditioned dataframe.
    '''
    temp = df.copy()
    if cond_type == 'add_one':
        conditioned_data = add_one_smoothing(temp)
    elif cond_type == 'hellinger':
        conditioned_data = hellinger(temp)
    else:
        conditioned_data = temp
    return conditioned_data

def smooth(df, type):
    '''
    Function smooth: Smoothing function to filter out noise
    :param df: @type pandas dataframe: The data to be smoothed
    :param type: @type string: The type of smoothing to do (currently sliding_window is the only option)
    :return: @type pandas dataframe: A dataframe of the smoothed data
    '''
    temp = df.copy()
    if type == 'sliding_window':
        result = temp.rolling(window_size, min_periods=1, center=True).mean()
    else:
        result = temp
    return result


def pca_abundance(df, num_pca_components=4, cond_type='hellinger'):
    '''
    Function pca_abundance: running PCA iteratively on the data, removing the highest/lowest abundance features
        (based on sorting of abundances array). The gradient is used to find the greatest change in inertia when
         features are removed. Then we select all the features up to that point. These are the most important features
    :param data: @type pandas dataframe: The data to run pca on
    :param num_pca_components: @type integer: The number of components to use for pca
    :param cond_type: @type string: The conditioning type to use for pca (eg. hellinger, add_one)
    :param smoothing_type: @type string: The type of smoothing to do on the dataframe of total eigenvalues found by PCA
    :return: important_features - a list of the most important features as found by running the PCA
    '''

    pca = PCA(n_components= num_pca_components)  # Run a PCA with n components
    data = df.copy()  # copy the data into a dataframe to manipulate
    eigen_df = pd.DataFrame() # create a dataframe to hold the eigenvalues from the pca

    abundances_arr = pd.unique(data.sum(axis=0)) #get the set of unique values
    abundances_arr = np.sort(abundances_arr)[::-1] # sort highest to lowest

    # now we want to loop through all the abundances and find those with the most variance
    # once we find those we'll have to match them back up to the features with those abundances
    # so that we can send back the list of sorted features
    for i in range(len(abundances_arr)):
        if len(abundances_arr)-i == num_pca_components:
            break
        conditioned_df = condition(data, cond_type)  # condition data
        result = pca.fit(conditioned_df)  # Run the PCA on the conditioned data here
        variance_arr = result.explained_variance_ratio_  # Output the variance associated with each eigenvector
        drop_list = list(data.columns[data.sum(axis=0) == abundances_arr[i]])  # Find all features with the current abundance
        components = result.components_
        variance_df = pd.DataFrame(variance_arr, columns=[str(abundances_arr[i])]).transpose()  # Convert the eigenvalues to a data frame of OTU rows x N components
        #variance_df = pd.DataFrame(variance_arr).transpose()  # Convert the eigenvalues to a data frame of OTU rows x N components
        eigen_df = eigen_df.append(variance_df)  # Append to the eigenvalue df
        data.drop(drop_list, inplace=True, axis=1)  # Drop all the features with the current abundance
        # You can only iterate over the number of features minus the number of components.
        if len(abundances_arr)-i == num_pca_components:
            break

    eigen_df['Total'] = eigen_df.sum(axis=1) # sum up the eigenvalues to get the total variance of all components
    #print('eigen df', eigen_df)
    total_eigen = eigen_df.copy().iloc[:,[-1]]
    total_eigen.sort_values(by='Total', ascending=0, inplace=True) # order the values in descending order, since we want to remove the highest eigenvalues

    # loop through each row and get the feature name and the abundance.
    # Match the feature name to the eigenvector variance from the total_eigen dataframe.
    # Then we'll return a dataframe with the feature as an index and the variance as the value
    ordered_features = pd.DataFrame(columns=['variance'])
    for index, row in df.sum(axis=0).iteritems():
        if str(row) in total_eigen.index:
            #print('variance = ',total_eigen['Total'].loc[str(row)])
            ordered_features.loc[index] = total_eigen['Total'].loc[str(row)]
        ordered_features.sort_values(by='variance', ascending=0, inplace=True)
    return ordered_features


def pca_importance(df, num_pca_components=4, cond_type='hellinger'):
    '''
    Function pca_importance: running PCA and selecting the most important features as found
        by the eigenvectors.
    :param data: @type pandas dataframe: The data to run pca on
    :param num_pca_components: @type integer: The number of components to use for pca
    :param select_n: @type integer: The number of important features to return
    :param cond_type: @type string: The conditioning type to use for pca (eg. hellinger, add_one)
    :param smoothing_type: @type string: The type of smoothing to do on the dataframe of total eigenvalues found by PCA
    :return: ordered_features - a numpy array of the features ordered from most important to least, as found by running the PCA
    '''

    pca = PCA(n_components=num_pca_components)  # Run a PCA with n components
    data = df.copy()  # copy the data into a dataframe to manipulate

    conditioned_df = condition(data, cond_type)  # condition data
    result = pca.fit(conditioned_df)  # Run the PCA on the conditioned data here
    components = result.components_ # the eigenvectors/components
    eigenvectors = pd.DataFrame(components, columns=[data.columns])
    abs_eigens = np.absolute(eigenvectors) #element wise absolute value to get rid of negatives
    variance = pd.DataFrame(abs_eigens.sum(axis=0), columns=['variance']) # sum up the components to get the amount of variance across all components for each OTU

    #variance = pd.DataFrame(abs_eigens.var(axis=0), columns=['variance']) # now we need to find the variance for each feature
    #order the features from largest to smallest to return as our sorted dataframe
    ordered_features = variance.sort_values(by='variance', ascending=0)
    #print('ordered_features columns', ordered_features.index.values)

    return ordered_features

def pca_legendre(df, num_pca_components, cond_type='hellinger'):
    return 0

def abundance(df):
    data = df.copy()
    summed_vals = data.sum(axis=0)
    sorted_abundances = summed_vals.sort_values(ascending=0)
    return sorted_abundances


'''
betweenness - build co-ocurrence graph. Take a and b and make edges proportional
to the variance of coocurrences. spearman correlation between all the OTUs become edges.
Do the spearman correlation between dataset one and two. all x's are one, all y's are the other (brome 1 and 2)
columns are measures of variable (vertex). have a distribution for each vertex and want to
see how much those distributions correlate between the two cases.
The strength of that correlation is the edge between the two vertices. The graph represents the correlation.
Then calculate betweenness on the graph to get the value.
'''

#this function computes the correlation matrix necessary to generate the graph
#any correlation supported by DataFrame.corr can be passed in (‘pearson’, ‘kendall’, ‘spearman’)
#Once MIC is implemented it will be added
def find_correlation(df, corr_type='spearman'):
    df_r = 0
    data = df.copy()
    if corr_type == 'MIC':
        # the pstats output for the mic and tic are condensed 1D arrays
        # we need to turn the output into a 2D upper triangular matrix and then mirror it to get the
        # full correlation matrix
        micp, ticp = minepy.pstats(data.T, alpha=0.6, c=15, est="mic_approx")
        num_features = data.shape[1]
        tri = np.zeros((num_features, num_features))
        tri[np.triu_indices(num_features, 1)] = micp
        full_corr = tri + tri.T

        df_r = pd.DataFrame(full_corr)
        df_r.columns = data.columns.values
        df_r.index = data.columns.values
    else:
        df_r = data.corr(corr_type)

    if isinstance(df_r, pd.DataFrame):
        df_r.fillna(0,inplace=True)  # ugly hack to make the NAs go away, should work for sampling but not advisable
        df_r = df_r[(df_r != 0).any(axis=1)]
        df_r = df_r.loc[:, (df_r != 0).any(axis=0)]
    return df_r

#this function returns the sorted centrality for a given centrality
#given a dataframe organized as an adjacency matrix, build a graph and compute the centrality
#return sorted centrality and the graph in networkx format
def graph_centrality(df, cent_type='betweenness', keep_thresh=0.5, cond_type='add_one', corr_type='spearman', weighted=False, corr_dir='none'):
    '''

    :param df: @type pandas DataFrame
    :param cent_type: @type string - valid values: betweenness, degree, closeness, eigenvector
    :param keep_thresh: @type float - default 0.5
    :param cond_type: @type: string - valid values: add_one, hellinger
    :param corr_type: @type: string - valid values: spearman, kendall, pearson, MIC
    :param weighted: @type: boolean - True if you want to produce a graph with weighted edges, False otherwise
    :param corr_dir: @type: string - valid values: none, positive, negative
    :return:
    '''
    data = df.copy()
    conditioned_df = condition(data, cond_type)  # condition data
    w_corr_df = find_correlation(conditioned_df, corr_type)
    if corr_dir == 'positive':
        w_corr_df_b = 1 - w_corr_df.copy()  #only keep strong positive correlations (small positive numbers)
    elif corr_dir == 'negative':
        w_corr_df_b = 1 + w_corr_df.copy() # only keep strong negative correlations (small negative numbers)
    else:
        w_corr_df_b = 1 - abs(w_corr_df.copy()) # keep both strong positive and negative correlations
    w_corr_df_b[(w_corr_df_b >= 1 - keep_thresh)] = 1 # set anything greater than the threshold value to 1 so we can remove it.
    labels = list(w_corr_df_b.index)
    temp = abs(w_corr_df_b.copy())
    temp.insert(0, 'var1', labels)

    if weighted == True:
        attr = 'weight'
    else:
        attr = 'edge'

    df_b = pd.melt(temp, 'var1', var_name='var2', value_name=attr)
    df_b = df_b.loc[((df_b[attr] <= 1 - keep_thresh) & (df_b[attr] > 0.0)), :]  # take only those edge pairs that made the cut
    df_g = networkx.from_pandas_dataframe(df_b, 'var1', 'var2', attr)  # takes a list of valid edges
    networkx.write_graphml(df_g, 'graph.graphml')
    #networkx.draw(df_g, with_labels=True)
    #networkx.draw(df_g)
    #pylab.show()

    #print('adjacency matrix', networkx.to_pandas_dataframe(df_g))
    am = networkx.to_pandas_dataframe(df_g)
    am.to_csv('adj_matrix.csv')

    if cent_type == 'betweenness':
        centrality = networkx.betweenness_centrality(df_g)
    elif cent_type == 'degree':
        centrality = networkx.degree_centrality(df_g)
    elif cent_type == 'closeness':
        centrality = networkx.closeness_centrality(df_g)
    elif cent_type == 'eigenvector':
        centrality = networkx.eigenvector_centrality(df_g)
    else:
        print('error, unknown centrality')
        return -1

    centrality_df = pd.DataFrame.from_dict(centrality, orient='index')

    if not centrality_df.empty:
        centrality_df = centrality_df[centrality_df.ix[:,0] > 0]

    if not centrality_df.empty:
        centrality_df.sort_values(0, axis=0, ascending=False, inplace=True)

    '''fig = plt.figure()
    plt.hist(centrality_df, bins=20)
    plt.xlabel('Centrality')
    plt.ylabel('Frequency')
    plt.title('Graph Centrality Distribution')
    plt.tight_layout()
    #fig.savefig('test.jpg')
    plt.show()'''

    return centrality_df

def selection(func, s_total, s_per_iter, df, *args):
    '''
    Function selection: does N loops of the metric before going to the evaluation step
    :param type: are we selecting features to remove or to retain
    :param N: the number of features for selection
    :return: not sure yet
    '''

    data = df.copy()
    feature_list = []
    selected_df = pd.DataFrame()
    # the metric (func) returns a dataframe of the most important features
    # when we get back this dataframe, we need to select a specified number of features (select_per_iter)
    # until we select the total number of features desired (select_total)
    selected = 0

    if s_total == 'all':
        select_total = len(data.columns)
    else:
        try:
            select_total = int(s_total)
        except:
            print('not a valid select total value')
            sys.exit(1)

    if s_per_iter == 'all':
        select_per_iter = len(data.columns)
    else:
        try:
            select_per_iter = int(s_per_iter)
        except:
            print('not a valid select per iteration value')

    # if they're selecting all at once, we only need to loop through once
    #if (s_total == 'all' and s_per_iter == 'all') or (s_total != 'all' and s_per_iter == 'all'):
    #    num_loops = 1
    #else:
    #    num_loops = math.ceil(select_total/select_per_iter)

    # make sure they aren't trying to select more features per iter than total features
    select_per_iter = min(select_per_iter, select_total)
    select = select_per_iter
    for i in range(0, math.ceil(select_total/select_per_iter)):
        #call the metric with the current data
        sorted_df = func(data, *args)
        if not sorted_df.empty:
            #print('sorted_df', sorted_df.head(), sorted_df.shape)
            if ((i+1)*select_per_iter > select_total):
                select = select_total % selected
            #take the top n features returned by the metric
            top_features = sorted_df.ix[:select].index.values
            selected_df = selected_df.append(sorted_df.ix[:select])
            selected += select
            # add to the list of features selected
            feature_list.extend(top_features)
            #remove the top features from the data frame
            data.drop(top_features.tolist(), axis=1, inplace=True)
        else:
            return selected_df
    results = selected_df
    return results


def reduction(func, select_total, remove_per_iter, df, *args):
    return 0

def evaluation(func, *args):
    result = func(*args)
    return result

def pca_inertia_eval(df, num_pca_components, cond_type, smoothing_type):
    '''
    Function pca_abundance: running PCA iteratively on the data, removing the highest/lowest abundance features
        (based on sorting of abundances array). The gradient is used to find the greatest change in inertia when
         features are removed. Then we select all the features up to that point. These are the most important features
    :param data: @type pandas dataframe: The data to run pca on
    :param num_pca_components: @type integer: The number of components to use for pca
    :param cond_type: @type string: The conditioning type to use for pca (eg. hellinger, add_one)
    :param smoothing_type: @type string: The type of smoothing to do on the dataframe of total eigenvalues found by PCA
    :return: important_features - a list of the most important features as found by running the PCA
    '''

    pca = PCA(n_components= num_pca_components)  # Run a PCA with n components
    data = df.copy()  # copy the data into a dataframe to manipulate
    eigen_df = pd.DataFrame() # create a dataframe to hold the eigenvalues from the pca

    abundances_arr = pd.unique(data.sum(axis=0)) #get the set of unique values

    #   ------------ QUESTION ----------
    # if it's sorted from lowest to highest, it can't run the PCA on the four biggest abundances
    # so they aren't in the eigen_df dataframe, meaning they aren't added to the important OTU list
    # Should we always sort highest to lowest, or should I be creating the important_OTUS list differently?
    abundances_arr = np.sort(abundances_arr)[::-1] # sort highest to lowest

    for i in range(len(abundances_arr)):
        conditioned_df = condition(data, cond_type)  # condition data
        result = pca.fit(conditioned_df)  # Run the PCA on the conditioned data here
        variance_arr = result.explained_variance_ratio_  # Output the variance associated with each eigenvector
        drop_list = list(data.columns[data.sum(axis=0) == abundances_arr[i]])  # Find the top features
        variance_df = pd.DataFrame(variance_arr, columns=[str(abundances_arr[i])]).transpose()  # Convert the eigenvalues to a data frame of OTU rows x N components
        eigen_df = eigen_df.append(variance_df)  # Append to the eigenvalue df
        data.drop(drop_list, inplace=True, axis=1)  # Drop all the features with the current abundance

        # You can only iterate over the number of features minus the number of components.
        if len(abundances_arr)-i == num_pca_components:
            break

    eigen_df['Total'] = eigen_df.sum(axis=1) # sum up the eigenvalues to get the total variance of all components
    total_eigen = eigen_df.copy().iloc[:,[-1]]
    #sorted list to return
    total_eigen.sort_values(by='Total', ascending=0, inplace=True) # order the values in descending order, since we want to remove the highest eigenvalues

    #evaluation
    smoothed = smooth(total_eigen, smoothing_type) # then smooth the values using a sliding window

    # use the gradient function to find the greatest slope between two abundances
    # this is our max inertia and we will return features above that point
    gradient = abs(np.gradient(smoothed.values.flatten()))
    smoothed['Gradient'] = gradient
    maxGradient = smoothed['Gradient'].argmax()
    topAbundances = smoothed.loc[:maxGradient].index.values

    #get all the features that have the abundance totals selected
    important_features = []
    for i in range(len(topAbundances)):
        important_features.extend(data.columns[data.sum(axis=0) == int(topAbundances[i])].values)

    #show the graph of the smoothed summed eigenvalues from running the PCA at each step.
    fig = plt.figure()
    ax = fig.add_subplot(111)
    smoothed['Total'].plot(kind='bar', title='Total Variation')
    ax.set_xticklabels([])
    plt.show()

    return important_features


def kl_divergence(A, B, features, select_per_iter, cond_type):
    '''

    :param A: @type: pandas dataframe - data file 1
    :param B: @type: pandas dataframe
    :param selected_features: @type - list
    :param select_per_iter: @type - int
    :return: @type list - the list of kl divergence values
    '''
    selected_features = list(features)
    #condition(data, cond_type)
    data1 = condition(A.sum(axis=0).transpose(), cond_type)  # KL divergence requires that histograms are the same size so sum to remove differences in number of samples
    data2 = condition(B.sum(axis=0).transpose(), cond_type)
    num_features = len(selected_features)
    diverge_vals = []
    feature_count = 0
    select = select_per_iter
    for i in range(0, math.ceil(num_features / select_per_iter)):
        if ((i+1)*select_per_iter > num_features):
            select = num_features % feature_count

        # need to drop the first 'select' features from the list
        selections = selected_features[:select]
        del selected_features[:select]
        data1.drop(selections, inplace=True)
        data2.drop(selections, inplace=True)

        if len(data1.shape) > 1:  # if there is more than one dimension, flatten
            tempA = data1.values.flatten()
        else:
            tempA = data1.values

        if len(data2.shape) > 1:  # if there is more than one dimension, flatten
            tempB = data2.values.flatten()
        else:
            tempB = data2.values

        feature_count += select
        kl_diverge = stats.entropy(tempA, tempB, 2.0)  # find the KL-Divergence base 2
        if kl_diverge > 1e50:
            kl_diverge = 1e50
        diverge_vals.append(kl_diverge)  # determine if the remaining histograms are more alike after elimination
        print('kl_diverge', kl_diverge)

    return diverge_vals


def main(ab_comp, infile1, infile2, metric, c_type, min_count, total_select, iteration_select, pca_components, smooth_type, window_size, centrality_type, keep_threshold, correlation, weighted, corr_prop, evaluation_type):
    t_start = time.perf_counter()

    infile1_path = infile1
    infile1_name = os.path.splitext(infile1_path)[0]
    infile2_path = ''
    infile2_name = ''
    if ab_comp:
        infile2_path = args.file2
        infile2_name = os.path.splitext(infile2_path)[0]

    #read the file(s) into a pandas dataframe and condition it
    file_a = pd.read_csv(infile1_path, index_col=False)
    file_a.fillna(0,inplace=True)

    if ab_comp:
        metric_params = [ab_comp, infile1_path, infile2_path, metric, centrality_type, total_select, iteration_select,
                         min_count, smooth_type, c_type, keep_threshold, correlation, weighted, corr_prop]
        eval_params = [ab_comp, infile1_path, infile2_path, evaluation, c_type, total_select, iteration_select]

        file_b = pd.read_csv(infile2_path, index_col=False)
        file_b.fillna(0, inplace=True)

        data_file = pd.concat([file_b, file_a])

        metric_filename = "{}-{}-{}-{}-select{}by{}-{}.csv".format(infile1_name, infile2_name, metric, centrality_type, total_select, iteration_select, weighted)
        abundance_filename = "{}-{}-{}-{}-select{}by{}-{}-abundances.csv".format(infile1_name, infile2_name, metric, centrality_type, total_select, iteration_select, weighted)

    else:
        metric_params = [ab_comp, infile1_path, metric, centrality_type, total_select,
                         iteration_select, min_count, smooth_type, c_type, keep_threshold, correlation, weighted, corr_prop]
        eval_params = [ab_comp, infile1_path, evaluation, c_type, total_select, iteration_select]

        data_file = file_a
        metric_filename = "{}-{}-{}-select{}by{}.csv".format(infile1_name, metric, centrality_type, total_select, iteration_select)
        abundance_filename = "{}-{}-{}-select{}by{}-abundances.csv".format(infile1_name, metric,
                                                                              centrality_type, total_select,
                                                                              iteration_select)

    if min_count != -1:
        data = remove_min_count(data_file, min_count)
    else:
        data = data_file

    top25 = data.sum(axis=0).nlargest(25)
    top25_names = list(top25.index.values)
    top25_abundances =  data[top25_names]
    top25_abundances.to_csv(abundance_filename, index=False)


    important_features = pd.DataFrame()
    if metric == 'graph_centrality':
        metric = graph_centrality
        important_features = selection(metric, total_select, iteration_select, data, centrality_type, keep_threshold, c_type, correlation, weighted, corr_prop)
    elif metric == 'pca_importance':
        metric = pca_importance
        important_features = selection(metric, total_select, iteration_select, data, pca_components,  c_type)
    elif metric == 'abundance':
        metric = abundance
        important_features = reduction(metric, total_select, iteration_select, data)
    #elif metric_in == '':

    t_end = time.perf_counter()
    runtime = t_end - t_start
    metric_params.append(runtime)




    # add the abundance totals to the resulting dataframe and create a list of the important feature names
    important_features['abundances'] = data[important_features.index.values].sum(axis=0) #add abundances to the df
    important_features.columns = ['metric_result','abundances']
    important_feature_list = list(important_features.index.values)

    #print('imp feat list', important_feature_list)
    feature_abundances = data[important_feature_list]
    feature_abundances.to_csv(abundance_filename, index=False)

    #add the metric information to the important features and append to the metric results csv
    feature_row = metric_params + important_feature_list
    with open('metric_results.csv', 'a') as f:
        writer = csv.writer(f)
        writer.writerow(feature_row)

    # get the abundances for each of the important features and write those to a new file
    print('final important features', important_features)
    important_features.to_csv(metric_filename)

    '''evaluation_results = evaluation(evaluation_type, file_a, file_b, important_feature_list, iteration_select, c_type)
    eval_row = eval_params + evaluation_results
    with open('evaluation_results.csv', 'a') as f:
        writer = csv.writer(f)
        writer.writerow(evaluation_results)
    print('evaluation results', eval_row)
    '''

# graph information loss, kl outlier divergence.
#% of total information loss since removal has occurred. or look at inflection point and how far away your N otus are from that.
if __name__ == "__main__":

    #get and set arguments for program
    parser = argparse.ArgumentParser()
    parser.add_argument('--ab_comp', '-ab', action='store_true', default=False)
    parser.add_argument('--file1', '-f1', help='First file to read in')
    parser.add_argument('--file2', '-f2', help='Second file to user for A/B comparison')
    parser.add_argument('--metric', '-m', help='Metric to use')
    parser.add_argument('--evaluation', '-e', help='Evaluation type to use')
    parser.add_argument('--min_features', '-min', help='Features with counts below this number will be removed', type= int, default=0)
    parser.add_argument('--conditioning', '-c', help='Conditioning type to use on the data')
    parser.add_argument('--total_select', '-st', help='Number of features to select in total')
    parser.add_argument('--iteration_select', '-si', help='Number of features to select for each time the metric is called')
    parser.add_argument('--pca_components', '-p', help='Number of pca components to find', type=int, default=4)
    parser.add_argument('--smooth', '-sm', help='Type of Smoothing to be used to remove noise', type=str, default='sliding_window')
    parser.add_argument('--window_size', '-w', help='If Smoothing type is a sliding window, this is the size of the window', type=int)
    parser.add_argument('--centrality', '-cent', help='If graph_centrality is the metric type, this is the type of Centrality to use')
    parser.add_argument('--threshold', '-th', help='If graph_centrality is the metric type, this is the threshold to use to remove weak edges', type=float, default=.5)
    parser.add_argument('--correlation', '-cor', help='If graph_centrality is the metric type, this is the type of correlation to use to build the graph')
    parser.add_argument('--weighted', '-wt', action='store_true', default=False,
                        help='If graph_centrality is the metric type, this specifies if weighted edges should be used to create the graph')
    parser.add_argument('--correlation_property', '-cp',
                        help='If graph centrality is the metric, this specifies if positive, negative, or both types of correlation should be used.', default='both')

    args = parser.parse_args()
    ab = args.ab_comp
    file1 = args.file1
    file2 = ''
    if ab:
        file2 = args.file2
    conditioning = args.conditioning
    min_features = args.min_features
    total_select = args.total_select
    iteration_select = args.iteration_select
    pca_components = args.pca_components
    smooth = args.smooth
    window_size = args.window_size
    centrality_type = args.centrality
    keep_threshold = args.threshold
    correlation = args.correlation
    weighted = args.weighted
    correlation_property = args.correlation_property
    metric = args.metric
    evaluation = args.evaluation

    main(ab, file1, file2, metric, conditioning, min_features, total_select, iteration_select, pca_components, smooth, window_size, centrality_type, keep_threshold, correlation,  weighted, correlation_property, evaluation)
