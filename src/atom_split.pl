:- debug.
:- use_module(library(csv)).
% :- use_module(library(lists)).

test(['Hello',
      'World',
      'from',
      'Prolog',
      '\n']).

split_atom_list(List, Output) :-
    split_atom_list_aux(List, [], Output).

%First call append to head of Queue. Length of empty list is 0.

split_atom_list_aux([H|Tail], Queue, Output) :-
    length(Queue, L),
    L =:= 0,
    atom_chars(H, Char_list),
    append([Char_list], Queue, New_Queue),
    split_atom_list_aux(Tail, New_Queue, Output).


%Subsequent calls leave Queue > 0.
split_atom_list_aux([H|Tail], Queue, Output) :-
    length(Queue, L),
    L > 0,
    atom_chars(H, Char_list),
    append(Queue, [Char_list], New_Queue),
    split_atom_list_aux(Tail, New_Queue, Output).

split_atom_list_aux([], Output, Output) :-
    write(Output).





